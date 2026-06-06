import asyncio
import logging
from pathlib import Path

import yaml
from fastapi import APIRouter, Depends, HTTPException, Request

from core.config import settings
from core.rate_limit import limiter
from core.whitelist import validate_scenario
from models.scenario import ScenarioResponse, StatusResponse
from services.docker_service import DockerService
from services.wazuh_service import WazuhService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/scenario", tags=["scenario"])


# ── Dependency factories ─────────────────────────────────────────────────────

def get_docker_service() -> DockerService:
    return DockerService(
        socket_url=settings.docker_socket,
        project_name=settings.compose_project_name,
    )


def get_wazuh_service() -> WazuhService:
    return WazuhService(
        api_url=settings.wazuh_api_url,
        username=settings.wazuh_api_username,
        password=settings.wazuh_api_password,
    )


# ── Helpers ──────────────────────────────────────────────────────────────────

def _assert_scenario_dir(name: str) -> Path:
    scenario_dir = settings.scenarios_path / name
    if not scenario_dir.exists():
        raise HTTPException(
            status_code=404,
            detail=f"Scenario directory not found: scenarios/{name}",
        )
    if not (scenario_dir / "docker-compose.override.yml").exists():
        raise HTTPException(
            status_code=404,
            detail=f"docker-compose.override.yml missing for scenario: {name}",
        )
    return scenario_dir


async def _run_blocking(fn, *args):
    loop = asyncio.get_running_loop()
    return await loop.run_in_executor(None, fn, *args)


# ── Shared start logic ───────────────────────────────────────────────────────

async def _do_start(name: str, docker_svc: DockerService) -> None:
    """Start containers and trigger Ansible; shared by /start and /reset."""
    scenario_dir = _assert_scenario_dir(name)
    await _run_blocking(docker_svc.start_scenario, name, settings.scenarios_path)

    # Find any service whose name contains "ansible" in the override file
    override_path = scenario_dir / "docker-compose.override.yml"
    try:
        with open(override_path) as fh:
            override_cfg = yaml.safe_load(fh)
        ansible_service = next(
            (s for s in (override_cfg.get("services") or {}) if "ansible" in s.lower()),
            None,
        )
    except Exception as exc:
        logger.warning("Could not parse override for Ansible detection: %s", exc)
        ansible_service = None

    if ansible_service:
        container_name = f"{settings.compose_project_name}_{ansible_service}_1"
        try:
            exit_code, output = await _run_blocking(
                docker_svc.run_ansible, container_name, "/ansible/playbook.yml"
            )
            if exit_code != 0:
                logger.warning(
                    "Ansible exited %s for %s:\n%s", exit_code, name, output
                )
        except Exception as exc:
            logger.warning("Ansible exec non-fatal error for %s: %s", name, exc)


# ── Endpoints ────────────────────────────────────────────────────────────────

@router.post("/{name}/start", response_model=ScenarioResponse)
@limiter.limit("5/minute")
async def start_scenario(
    request: Request,
    name: str,
    docker_svc: DockerService = Depends(get_docker_service),
) -> ScenarioResponse:
    validate_scenario(name)

    try:
        await _do_start(name, docker_svc)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("start_scenario %s failed: %s", name, exc)
        raise HTTPException(
            status_code=500, detail=f"Failed to start scenario: {exc}"
        )

    return ScenarioResponse(status="starting", scenario=name)


@router.post("/{name}/stop", response_model=ScenarioResponse)
@limiter.limit("5/minute")
async def stop_scenario(
    request: Request,
    name: str,
    docker_svc: DockerService = Depends(get_docker_service),
) -> ScenarioResponse:
    validate_scenario(name)

    try:
        await _run_blocking(docker_svc.stop_scenario, name)
    except Exception as exc:
        logger.error("stop_scenario %s failed: %s", name, exc)
        raise HTTPException(
            status_code=500, detail=f"Failed to stop scenario: {exc}"
        )

    return ScenarioResponse(status="stopped", scenario=name)


@router.post("/{name}/reset", response_model=ScenarioResponse)
@limiter.limit("5/minute")
async def reset_scenario(
    request: Request,
    name: str,
    docker_svc: DockerService = Depends(get_docker_service),
) -> ScenarioResponse:
    validate_scenario(name)

    try:
        await _run_blocking(docker_svc.stop_scenario, name)
        await _do_start(name, docker_svc)
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("reset_scenario %s failed: %s", name, exc)
        raise HTTPException(
            status_code=500, detail=f"Failed to reset scenario: {exc}"
        )

    return ScenarioResponse(status="resetting", scenario=name)


@router.get("/{name}/status", response_model=StatusResponse)
async def get_scenario_status(
    request: Request,
    name: str,
    wazuh_svc: WazuhService = Depends(get_wazuh_service),
) -> StatusResponse:
    validate_scenario(name)

    success_criteria = settings.scenarios_path / name / "success-criteria.json"
    if not success_criteria.exists():
        return StatusResponse(status="idle", scenario=name)

    alert = await wazuh_svc.get_matching_alert(success_criteria)

    if alert:
        return StatusResponse(status="success", scenario=name, alert=alert)

    return StatusResponse(status="running", scenario=name)
