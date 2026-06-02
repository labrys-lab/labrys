#!/usr/bin/env bash
set -euo pipefail

# Polls the OpenSearch cluster health endpoint until status is green or yellow.
# Usage: ./wait-for-opensearch.sh [timeout_seconds]
#
# Runs curl inside the opensearch container via docker compose exec.
# Reads credentials from .env (OPENSEARCH_INITIAL_ADMIN_PASSWORD).

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

# Credentials — username is always 'admin' for the OpenSearch built-in admin user.
# Password is read from .env; OPENSEARCH_USERNAME can override the username.
username="$(get_env_var OPENSEARCH_USERNAME)"
[[ -z "${username}" ]] && username="admin"

password="$(get_env_var OPENSEARCH_INITIAL_ADMIN_PASSWORD)"
if [[ -z "${password}" ]]; then
    err "OPENSEARCH_INITIAL_ADMIN_PASSWORD is not set in ${ENV_FILE}"
    exit 1
fi

timeout="${1:-120}"
interval=10
elapsed=0

echo ""
info "Waiting for OpenSearch (container: opensearch) → https://localhost:9200/_cluster/health"
info "Timeout: ${timeout}s  |  Polling every ${interval}s"
echo ""

while [[ "${elapsed}" -lt "${timeout}" ]]; do
    response=""
    if response=$(docker compose -f "${REPO_DIR}/docker-compose.yml" exec -T opensearch \
            curl -s -k -u "${username}:${password}" \
            https://localhost:9200/_cluster/health 2>/dev/null) \
       && printf '%s' "${response}" | grep -qE '"status":"(green|yellow)"'; then
        ok "OpenSearch is ready (status: $(printf '%s' "${response}" | grep -oE '"status":"[^"]*"' | cut -d'"' -f4))"
        echo ""
        exit 0
    fi

    echo -e "  ${YELLOW}→${NC} Not ready yet... (${elapsed}s / ${timeout}s)"
    sleep "${interval}"
    elapsed=$(( elapsed + interval ))
done

err "OpenSearch did not become ready within ${timeout}s."
err "Check container logs: docker compose logs opensearch"
exit 1
