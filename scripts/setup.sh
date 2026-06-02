#!/usr/bin/env bash
set -euo pipefail

# ── Paths ──────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "${SCRIPT_DIR}")"
ENV_FILE="${REPO_DIR}/.env"

# ── Colors ─────────────────────────────────────────────────────────────────────
RED='\033[0;31m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }
warn() { echo -e "${YELLOW}[ WARN]${NC} $*"; }
ok()   { echo -e "${GREEN}[  OK ]${NC} $*"; }
info() { echo -e "${BOLD}[ .... ]${NC} $*"; }

# Read a single variable from the .env file without sourcing it globally.
# Strips surrounding single/double quotes. Returns empty string if key not found.
get_env_var() {
    local key="$1"
    local raw
    raw=$(grep -E "^${key}=" "${ENV_FILE}" 2>/dev/null | head -1 | cut -d'=' -f2-) || true
    # Strip surrounding quotes
    raw="${raw#\"}" ; raw="${raw%\"}"
    raw="${raw#\'}" ; raw="${raw%\'}"
    printf '%s' "${raw}"
}

echo ""
echo -e "${BOLD}SOC Lab — Pre-flight Check${NC}"
echo -e "${BOLD}══════════════════════════${NC}"
echo ""

# ── 1. Root check ──────────────────────────────────────────────────────────────
if [[ "${EUID}" -eq 0 ]]; then
    warn "Running as root. This is not recommended unless Docker requires it on your system."
else
    ok "Not running as root"
fi

# ── 2. Dependency checks ───────────────────────────────────────────────────────
info "Checking required tools..."

missing_deps=()

for cmd in docker ansible ansible-playbook; do
    if ! command -v "${cmd}" &>/dev/null; then
        missing_deps+=("${cmd}")
    else
        ok "${cmd}"
    fi
done

# docker compose v2 plugin is a subcommand, not a standalone binary
if ! docker compose version &>/dev/null 2>&1; then
    missing_deps+=("docker-compose-plugin")
else
    ok "docker compose (v2)"
fi

if [[ "${#missing_deps[@]}" -gt 0 ]]; then
    echo ""
    for dep in "${missing_deps[@]}"; do
        err "Missing dependency: ${dep}"
    done
    err ""
    err "Install all missing tools and re-run this script."
    exit 1
fi

# ── 3. .env file ───────────────────────────────────────────────────────────────
info "Checking .env file..."

if [[ ! -f "${ENV_FILE}" ]]; then
    err ".env file not found."
    err ""
    err "Run the following command and fill in the required values:"
    err "  cp ${REPO_DIR}/.env.example ${ENV_FILE}"
    exit 1
fi
ok ".env found at ${ENV_FILE}"

# ── 4. Required variable validation ────────────────────────────────────────────
info "Validating required .env variables..."

required_vars=(
    OPENSEARCH_HEAP
    OPENSEARCH_INITIAL_ADMIN_PASSWORD
    WAZUH_API_USERNAME
    WAZUH_API_PASSWORD
    SAMBA_DOMAIN
    SAMBA_REALM
    SAMBA_ADMIN_PASSWORD
    LAB_DOMAIN
)

missing_vars=()
for var in "${required_vars[@]}"; do
    value="$(get_env_var "${var}")"
    if [[ -z "${value}" ]]; then
        missing_vars+=("${var}")
    else
        ok "${var}"
    fi
done

if [[ "${#missing_vars[@]}" -gt 0 ]]; then
    echo ""
    for var in "${missing_vars[@]}"; do
        err "Not set or empty: ${var}"
    done
    err ""
    err "Set the missing variables in ${ENV_FILE} and re-run this script."
    exit 1
fi

# ── 5. Placeholder password check ─────────────────────────────────────────────
info "Checking for default placeholder passwords..."

placeholder="ChangeMe!2024"
placeholder_found=false

for var in OPENSEARCH_INITIAL_ADMIN_PASSWORD WAZUH_API_PASSWORD SAMBA_ADMIN_PASSWORD; do
    value="$(get_env_var "${var}")"
    if [[ "${value}" == "${placeholder}" ]]; then
        warn "${var} is still set to the default placeholder value (${placeholder})."
        warn "  → Update ${var} in ${ENV_FILE} before using this lab in any shared environment."
        placeholder_found=true
    fi
done

if [[ "${placeholder_found}" == false ]]; then
    ok "No placeholder passwords detected"
fi

# ── 6. vm.max_map_count ────────────────────────────────────────────────────────
info "Checking vm.max_map_count (required by OpenSearch)..."

required_map_count=262144
current_map_count="$(cat /proc/sys/vm/max_map_count)"

if [[ "${current_map_count}" -lt "${required_map_count}" ]]; then
    warn "vm.max_map_count is ${current_map_count} (required: ≥ ${required_map_count})."
    warn "OpenSearch will crash at startup without this setting."
    echo ""

    # Only prompt if stdin is a terminal
    response="n"
    if [[ -t 0 ]]; then
        echo -n "  Set vm.max_map_count=${required_map_count} now? [y/N] "
        read -r response || response="n"
    else
        warn "  Non-interactive mode detected — skipping automatic fix."
    fi

    if [[ "${response,,}" == "y" ]]; then
        if sudo sysctl -w vm.max_map_count="${required_map_count}"; then
            ok "vm.max_map_count set to ${required_map_count} (current session only)."
            warn "To make this permanent, add the following line to /etc/sysctl.conf:"
            warn "  vm.max_map_count=${required_map_count}"
            warn "Then run: sudo sysctl -p"
        else
            err "Failed to set vm.max_map_count. Run manually:"
            err "  sudo sysctl -w vm.max_map_count=${required_map_count}"
            err "OpenSearch will not start until this is set."
        fi
    else
        warn "Skipped. Run the following before starting the stack:"
        warn "  sudo sysctl -w vm.max_map_count=${required_map_count}"
    fi
else
    ok "vm.max_map_count=${current_map_count}"
fi

# ── 7. RAM check ───────────────────────────────────────────────────────────────
info "Checking available RAM..."

total_ram_kb="$(grep MemTotal /proc/meminfo | awk '{print $2}')"
total_ram_gb="$(( total_ram_kb / 1024 / 1024 ))"

if [[ "${total_ram_gb}" -lt 16 ]]; then
    warn "System has ~${total_ram_gb}GB RAM. Minimum recommended is 16GB."
    warn "The stack may be slow or unstable. Consider reducing OPENSEARCH_HEAP in ${ENV_FILE}."
else
    ok "RAM: ~${total_ram_gb}GB"
fi

# ── 8. Disk space check ────────────────────────────────────────────────────────
info "Checking available disk space..."

free_kb="$(df -k "${REPO_DIR}" | awk 'NR==2 {print $4}')"
free_gb="$(( free_kb / 1024 / 1024 ))"

if [[ "${free_gb}" -lt 50 ]]; then
    warn "Only ~${free_gb}GB free on the partition containing the repo (${REPO_DIR})."
    warn "Minimum recommended is 50GB. Docker images and volumes may fill the disk."
else
    ok "Disk: ~${free_gb}GB free on $(df -k "${REPO_DIR}" | awk 'NR==2 {print $1}')"
fi

# ── 9. Validate docker-compose.yml ────────────────────────────────────────────
info "Validating docker-compose.yml..."

cd "${REPO_DIR}"
if ! docker compose config --quiet 2>&1; then
    err "docker-compose.yml validation failed. Fix the errors above and re-run."
    exit 1
fi
ok "docker-compose.yml is valid"

# ── 10. Success summary ────────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}  All pre-flight checks passed. Ready to start the lab.${NC}"
echo -e "${GREEN}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  Run:  ${BOLD}docker compose up -d${NC}"
echo ""
