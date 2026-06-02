# SOC Lab — Project Context

## Summary
A realistic, isolated SOC laboratory that spins up with a single command (`docker compose up`).
Users select an attack scenario, the lab environment is provisioned automatically, they execute the attack manually, and observe the alert in Wazuh.
Free, open-source, cloned from GitHub and run locally.

## Target Audience
- SOC analysts
- Cybersecurity students
- Security professionals learning Active Directory

## Scenarios
- Kerberoasting
- Pass-the-Hash
- DCSync
- Brute Force
- Port Scan
- SQLi / LFI

## Tools and Rationale

| Tool | Role | Why |
|---|---|---|
| Wazuh | Log collection, alert generation | Open-source, used in real-world SOC environments |
| OpenSearch | Log storage and search | Free fork of Elasticsearch, officially supported by Wazuh |
| Samba AD | Active Directory environment | No Windows license required, supports all AD scenarios |
| Kali Linux | Attack machine | All tools pre-installed |
| Docker + Compose | Container management | Portable, reproducible environment |
| FastAPI | Scenario engine (backend) | Python, lightweight, fast |
| Next.js | Web interface (frontend) | React-based, powerful |
| Caddy | Reverse proxy | Automatic HTTPS, simple config |
| Ansible | Automated configuration | In-container setup and vulnerability injection |

## Architecture Decisions

### Network Layout
- `lab-network` — Kali, Samba AD, Ubuntu Target (isolated, no internet access)
- `soc-network` — Wazuh, OpenSearch (isolated, no internet access)
- `management-network` — FastAPI, Next.js, Caddy (externally accessible)
- Wazuh Manager is attached to both `lab-network` and `soc-network`

### Log Flow
Container starts → entrypoint script runs → Wazuh agent automatically registers with Manager

### Scenario Trigger Flow
Next.js → FastAPI → Docker Compose override → Ansible → "lab ready"

### Success Detection
FastAPI polls the Wazuh API → returns "success" when the scenario-specific alert fires

### Manual Attack Execution
Attacks are never automated. The user enters the Kali terminal and follows the step-by-step guide in the web UI. This is intentional — learning requires doing.

## What Each Scenario Contains
1. Pre-configured vulnerable environment
2. Step-by-step attack guide (commands the user runs manually)
3. SIEM detection rules (Wazuh)
4. Success criteria (which alert = success)
5. Explanation (how the attack works, what defenders should look for)
6. Lab reset capability

## Portability Rules
- Nothing is hardcoded (no IPs, passwords, or paths)
- All configuration lives in `.env`
- User workflow: `git clone` → `cp .env.example .env` → `docker compose up`
- Supports Linux (Ubuntu 24) and WSL2

## Repository Structure
```
soc-lab/
├── docker-compose.yml
├── .env.example
├── wazuh/
├── samba/
├── kali/
├── targets/
├── caddy/
├── scenarios/
│   └── [scenario-name]/
│       ├── docker-compose.override.yml
│       ├── ansible/
│       ├── wazuh-rules/
│       ├── attack/
│       ├── success-criteria.json
│       └── README.md
├── ansible/
├── api/
├── ui/
├── healthcheck/
├── scripts/
└── docs/
```

## Development Environment
- OS: Linux (Ubuntu 24) or WSL2
- RAM: minimum 16GB, recommended 32GB
- Disk: minimum 50GB free space
- Docker and Docker Compose must be installed

## Team
2-person team. Task breakdown is in TODO.md.
