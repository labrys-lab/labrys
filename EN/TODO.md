# TODO

## Status Legend
- [ ] Not started
- [~] In progress
- [x] Done

---

## Person 1

### Infrastructure
- [x] Docker Compose base stack (all containers, networks, volumes)
- [x] Wazuh Manager + OpenSearch + OpenSearch Dashboards setup
- [x] Samba AD container setup and domain configuration
- [x] Caddy reverse proxy configuration
- [x] `scripts/setup.sh` (pre-flight checks, vm.max_map_count, .env validation)
- [~] `healthcheck/` (service readiness checks for OpenSearch, Wazuh, Samba AD)

### Scenarios
- [ ] Kerberoasting
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — vulnerability injection (SPN setup, weak service account)
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md` — attack explanation + defensive notes

- [ ] Pass-the-Hash
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — vulnerability injection
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] Port Scan
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — target configuration
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md`

---

## Person 2

### Application
- [x] FastAPI scenario engine
  - [x] `POST /scenario/{name}/start`
  - [x] `POST /scenario/{name}/stop`
  - [x] `POST /scenario/{name}/reset`
  - [x] `GET /scenario/{name}/status`
  - [x] Wazuh API polling for success detection
  - [x] Scenario name allowlist validation
  - [x] Rate limiting on all action endpoints

- [x] Next.js web interface
  - [x] Scenario cards (name, difficulty, estimated duration, description)
  - [x] Lab status (idle, starting, ready, running, success)
  - [x] Connection details (Kali terminal access, Wazuh Dashboard link)
  - [x] Step-by-step attack guide panel
  - [x] Alert feed summary
  - [x] Success state display
  - [x] Lab reset button

- [ ] Kali Linux container setup (pre-installed tools: Impacket, Hashcat, Nmap, SQLmap, CrackMapExec)
- [ ] Ubuntu Target container setup (Wazuh agent entrypoint script)

### Scenarios
- [ ] DCSync
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — vulnerability injection (DA account setup)
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] Brute Force
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — vulnerability injection
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md`

- [ ] SQLi / LFI
  - [ ] `docker-compose.override.yml`
  - [ ] `ansible/` — vulnerable web app setup
  - [ ] `wazuh-rules/` — detection rule
  - [ ] `attack/` — step-by-step guide
  - [ ] `success-criteria.json`
  - [ ] `README.md`

---

## Both

- [ ] README.md (written last, after everything works)
- [ ] Cross-review each other's work before merging to `main`
- [ ] End-to-end test: full scenario run from `docker compose up` to success alert
