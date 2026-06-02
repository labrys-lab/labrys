# AGENTS.md

## Must-follow constraints

- Never hardcode IPs, passwords, or paths. All config lives in `.env`. Use `.env.example` as template.
- Never expose `lab-network` or `soc-network` to the host network or internet.
- Kali container must have no internet access. Egress must be blocked at the Docker network level.
- Wazuh rules are per-scenario. Never modify `wazuh/` global rules for scenario-specific logic — use `scenarios/[name]/wazuh-rules/` instead.
- Never auto-execute attack scripts. Attack steps are manual — user runs them in Kali terminal.
- `success-criteria.json` drives automated success detection via Wazuh API. Do not hardcode alert IDs in FastAPI.
- FastAPI uses Docker SDK (not shell subprocess) to manage containers.
- OpenSearch heap is set via `.env` (`OPENSEARCH_HEAP`). Never set it inside `docker-compose.yml` directly.

## Validation before finishing

- `docker compose config` — validate compose files before committing
- `docker compose -f docker-compose.yml -f scenarios/[name]/docker-compose.override.yml config` — validate scenario overrides
- Ansible playbooks: `ansible-playbook --syntax-check`
- FastAPI: `uvicorn app.main:app` must start without errors

## Repo-specific conventions

- Each scenario is self-contained. A scenario must work with only its own `docker-compose.override.yml` + `ansible/` + `wazuh-rules/`.
- Startup order matters: OpenSearch → Wazuh Manager → Wazuh Agents. Use `depends_on` with `healthcheck`.
- Wazuh agent registration is handled by the container entrypoint script, not Ansible.
- Ansible is only for post-boot configuration (vulnerability injection, AD user/SPN setup).
- `scripts/setup.sh` runs before `docker compose up`. Do not move pre-flight checks into compose.

## Important locations

- `.env.example` — source of truth for all configurable values
- `scenarios/[name]/success-criteria.json` — alert rule IDs that trigger success state
- `scenarios/[name]/wazuh-rules/` — scenario-specific Wazuh rules, loaded at lab start
- `api/` — FastAPI backend
- `ui/` — Next.js frontend
- `healthcheck/` — service readiness checks (used by scripts, not compose)

## Change safety rules

- Adding a new scenario must not affect the base stack (`docker-compose.yml`).
- Changes to `wazuh/` config affect all scenarios — verify all scenarios still work.
- Changes to FastAPI `/scenario/{name}/start` endpoint must preserve the response contract: `{status, connections, message}`.
- Do not change Docker network names (`lab-network`, `soc-network`, `management-network`) — they are referenced across multiple files.

## Known gotchas

- Samba AD takes 30-60s to fully initialize. Agents joining the domain will fail if they start before AD is ready. Use a healthcheck wait loop in entrypoint.
- OpenSearch requires `vm.max_map_count=262144` on the host. `scripts/setup.sh` sets this — if skipped, OpenSearch crashes silently.
- Wazuh Dashboard may show no data for 2-3 minutes after agent registration. This is normal.
- `docker compose down` does not remove named volumes. Use `docker compose down -v` to fully reset a lab.
