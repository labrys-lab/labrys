#!/usr/bin/env bash
set -euo pipefail

# Polls the samba-ad container until `samba-tool domain info` exits 0.
# Uses `docker compose exec` — does not require port exposure on the host.
# Usage: ./wait-for-samba.sh [timeout_seconds]

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "${SCRIPT_DIR}")"

RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
warn() { echo -e "${YELLOW}[ WARN]${NC} $*"; }
ok()   { echo -e "${GREEN}[  OK ]${NC} $*"; }
info() { echo -e "${BOLD}[ .... ]${NC} $*"; }

timeout="${1:-120}"
interval=10
elapsed=0

echo ""
info "Waiting for Samba AD (samba-ad container) to become ready..."
info "Timeout: ${timeout}s  |  Polling every ${interval}s"
echo ""

while [[ "${elapsed}" -lt "${timeout}" ]]; do
    # -T disables pseudo-TTY allocation — required for non-interactive use.
    # Redirect all output; we only care about the exit code.
    if docker compose -f "${REPO_DIR}/docker-compose.yml" \
            exec -T samba-ad samba-tool domain info 127.0.0.1 &>/dev/null; then
        ok "Samba AD is ready"
        echo ""
        exit 0
    fi

    echo -e "  ${YELLOW}→${NC} Not ready yet... (${elapsed}s / ${timeout}s)"
    sleep "${interval}"
    elapsed=$(( elapsed + interval ))
done

err "Samba AD did not become ready within ${timeout}s."
err "Check container logs: docker compose logs samba-ad"
exit 1
