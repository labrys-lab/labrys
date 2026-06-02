#!/usr/bin/env bash
set -euo pipefail

# Polls the Wazuh REST API until it returns HTTP 200.
# Usage: ./wait-for-wazuh.sh [timeout_seconds]
#
# Runs curl inside the wazuh-manager container via docker compose exec.
# Reads WAZUH_API_USERNAME and WAZUH_API_PASSWORD from .env.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "${SCRIPT_DIR}")"
ENV_FILE="${REPO_DIR}/.env"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
warn() { echo -e "${YELLOW}[ WARN]${NC} $*"; }
ok()   { echo -e "${GREEN}[  OK ]${NC} $*"; }
info() { echo -e "${BOLD}[ .... ]${NC} $*"; }

get_env_var() {
    local key="$1"
    local raw
    raw=$(grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | head -1 | cut -d'=' -f2-) || true
    raw="${raw#\"}" ; raw="${raw%\"}"
    raw="${raw#\'}" ; raw="${raw%\'}"
    printf '%s' "${raw}"
}

if [[ ! -f "${ENV_FILE}" ]]; then
    err ".env not found at ${ENV_FILE}"
    err "Run: cp ${REPO_DIR}/.env.example ${ENV_FILE}"
    exit 1
fi

username="$(get_env_var WAZUH_API_USERNAME)"
if [[ -z "${username}" ]]; then
    err "WAZUH_API_USERNAME is not set in ${ENV_FILE}"
    exit 1
fi

password="$(get_env_var WAZUH_API_PASSWORD)"
if [[ -z "${password}" ]]; then
    err "WAZUH_API_PASSWORD is not set in ${ENV_FILE}"
    exit 1
fi

timeout="${1:-120}"
interval=10
elapsed=0

echo ""
info "Waiting for Wazuh API (container: wazuh-manager) → https://localhost:55000/"
info "Timeout: ${timeout}s  |  Polling every ${interval}s"
echo ""

while [[ "${elapsed}" -lt "${timeout}" ]]; do
    http_code=""
    if http_code=$(docker compose -f "${REPO_DIR}/docker-compose.yml" exec -T wazuh-manager \
            curl -s -k -o /dev/null -w "%{http_code}" \
            -u "${username}:${password}" \
            https://localhost:55000/ 2>/dev/null) \
       && [[ "${http_code}" == "200" ]]; then
        ok "Wazuh API is ready (HTTP ${http_code})"
        echo ""
        exit 0
    fi

    echo -e "  ${YELLOW}→${NC} Not ready yet (HTTP ${http_code:-000})... (${elapsed}s / ${timeout}s)"
    sleep "${interval}"
    elapsed=$(( elapsed + interval ))
done

err "Wazuh API did not become ready within ${timeout}s."
err "Check container logs: docker compose logs wazuh-manager"
exit 1
