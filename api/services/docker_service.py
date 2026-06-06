import logging
from pathlib import Path
from typing import Optional

import docker
import docker.errors
import yaml

logger = logging.getLogger(__name__)

# Labels Docker Compose sets on every container it manages
_LABEL_PROJECT = "com.docker.compose.project"
_LABEL_SERVICE = "com.docker.compose.service"
# Custom label to scope stop/reset to a specific scenario
_LABEL_SCENARIO = "com.labrys.scenario"


class DockerService:
    def __init__(self, socket_url: str, project_name: str) -> None:
        self.client = docker.DockerClient(base_url=socket_url)
        self.project_name = project_name

    # ── Public API ──────────────────────────────────────────────────────────

    def start_scenario(self, scenario_name: str, scenarios_path: Path) -> None:
        """Parse scenario override file and start containers via Docker SDK."""
        override_path = scenarios_path / scenario_name / "docker-compose.override.yml"
        with open(override_path) as fh:
            override = yaml.safe_load(fh)

        for net_name in (override.get("networks") or {}):
            self._ensure_network(net_name)

        services = override.get("services") or {}
        for service_name in self._resolve_start_order(services):
            service_cfg = services[service_name]
            if service_cfg is None:
                continue
            self._start_service(service_name, service_cfg, scenario_name)

    def stop_scenario(self, scenario_name: str) -> None:
        """Stop and remove all containers tagged with this scenario."""
        containers = self.client.containers.list(
            all=True,
            filters={"label": f"{_LABEL_SCENARIO}={scenario_name}"},
        )
        for container in containers:
            try:
                if container.status == "running":
                    container.stop(timeout=10)
                container.remove(force=True)
                logger.info("Removed container %s", container.name)
            except docker.errors.NotFound:
                pass

    def run_ansible(self, container_name: str, playbook_path: str) -> tuple[int, str]:
        """Execute ansible-playbook inside a running container using Docker exec."""
        try:
            container = self.client.containers.get(container_name)
            result = container.exec_run(
                cmd=["ansible-playbook", playbook_path],
                workdir="/ansible",
                demux=False,
            )
            output = (
                result.output.decode("utf-8", errors="replace")
                if result.output
                else ""
            )
            return result.exit_code, output
        except docker.errors.NotFound:
            logger.error("Container %s not found for Ansible exec", container_name)
            return 1, f"Container {container_name} not found"
        except docker.errors.APIError as exc:
            logger.error("Docker exec error on %s: %s", container_name, exc)
            return 1, str(exc)

    # ── Internals ───────────────────────────────────────────────────────────

    def _resolve_start_order(self, services: dict) -> list[str]:
        """Topological sort based on depends_on."""
        order: list[str] = []
        visited: set[str] = set()

        def visit(name: str) -> None:
            if name in visited:
                return
            visited.add(name)
            cfg = services.get(name) or {}
            deps = cfg.get("depends_on") or []
            if isinstance(deps, dict):
                deps = list(deps.keys())
            for dep in deps:
                visit(dep)
            order.append(name)

        for svc in services:
            visit(svc)
        return order

    def _ensure_network(self, network_name: str) -> None:
        full_name = f"{self.project_name}_{network_name}"
        if not self.client.networks.list(names=[full_name]):
            self.client.networks.create(
                name=full_name,
                driver="bridge",
                labels={_LABEL_PROJECT: self.project_name},
            )
            logger.info("Created network %s", full_name)

    def _start_service(
        self, service_name: str, cfg: dict, scenario_name: str
    ) -> None:
        image: Optional[str] = cfg.get("image")
        if not image:
            logger.warning("Service %s has no image — skipping", service_name)
            return

        container_name = f"{self.project_name}_{service_name}_1"

        # Remove any stale container with the same name
        try:
            stale = self.client.containers.get(container_name)
            stale.remove(force=True)
            logger.info("Removed stale container %s", container_name)
        except docker.errors.NotFound:
            pass

        # Pull image only if it is not already present
        try:
            self.client.images.get(image)
        except docker.errors.ImageNotFound:
            logger.info("Pulling image %s", image)
            self.client.images.pull(image)

        # Resolve network names to fully-qualified names
        raw_networks = cfg.get("networks") or []
        if isinstance(raw_networks, dict):
            raw_networks = list(raw_networks.keys())
        networks = [f"{self.project_name}_{n}" for n in raw_networks]
        first_network = networks[0] if networks else None
        extra_networks = networks[1:]

        # Volume binds: "host:container[:mode]"
        volume_binds: dict[str, dict] = {}
        for vol in cfg.get("volumes") or []:
            if isinstance(vol, str) and ":" in vol:
                parts = vol.split(":")
                volume_binds[parts[0]] = {
                    "bind": parts[1],
                    "mode": parts[2] if len(parts) > 2 else "rw",
                }

        # env_file: load variables from file(s) and merge with inline environment
        env_file_vars: list[str] = []
        for ef in cfg.get("env_file") or []:
            ef_path = Path(ef)
            if ef_path.exists():
                with open(ef_path) as fh:
                    for line in fh:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            env_file_vars.append(line)
            else:
                logger.warning("env_file %s not found — skipping", ef)

        environment = list(cfg.get("environment") or []) + env_file_vars

        # Port bindings: "host_port:container_port" or "ip:host_port:container_port"
        port_bindings: dict[str, str] = {}
        for p in cfg.get("ports") or []:
            if isinstance(p, str) and ":" in p:
                parts = p.split(":")
                host_port = parts[-2]
                container_port = parts[-1]
                port_bindings[container_port] = host_port

        labels = {
            _LABEL_PROJECT: self.project_name,
            _LABEL_SERVICE: service_name,
            _LABEL_SCENARIO: scenario_name,
        }

        restart_value = cfg.get("restart", "unless-stopped")

        # Create (but do not start) so we can connect all networks first
        container = self.client.containers.create(
            image=image,
            name=container_name,
            environment=environment or None,
            volumes=volume_binds or None,
            labels=labels,
            cap_add=cfg.get("cap_add") or None,
            cap_drop=cfg.get("cap_drop") or None,
            ports=port_bindings or None,
            network=first_network,
            restart_policy={"Name": restart_value},
        )

        for net_name in extra_networks:
            try:
                net = self.client.networks.get(net_name)
                net.connect(container)
            except docker.errors.NotFound:
                logger.warning("Network %s not found — skipping connection", net_name)

        container.start()
        logger.info("Started container %s (image: %s)", container_name, image)
