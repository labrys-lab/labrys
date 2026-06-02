# SOC Lab — Architecture

## Overview

```
User
    │
    ▼
┌─────────────────────┐
│   Next.js (Web UI)  │
│   Select scenario   │
│   View lab status   │
│   View alert feed   │
└────────┬────────────┘
         │
         ▼
┌─────────────────────┐
│   FastAPI (API)     │
│   Scenario engine   │
│   Polls Wazuh API   │
│   Success detection │
└────────┬────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────┐
│                Docker Compose                       │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ management-network (externally accessible)   │   │
│  │  Caddy (reverse proxy)                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ soc-network (isolated)                       │   │
│  │  Wazuh Manager                               │   │
│  │  OpenSearch                                  │   │
│  │  OpenSearch Dashboards                       │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  ┌──────────────────────────────────────────────┐   │
│  │ lab-network (isolated, no internet access)   │   │
│  │  Samba AD (Domain Controller)                │   │
│  │  Ubuntu Target (Wazuh agent pre-installed)   │   │
│  │  Kali Linux (attack machine)                 │   │
│  └──────────────────────────────────────────────┘   │
│                                                     │
│  Wazuh Manager bridges soc-network + lab-network    │
└─────────────────────────────────────────────────────┘
```

## Network Layout

### lab-network
- Contains: Kali, Samba AD, Ubuntu Target
- No internet access
- Kali attacks other machines within this network only

### soc-network
- Contains: Wazuh Manager, OpenSearch, OpenSearch Dashboards
- No internet access
- All logs are collected and stored here

### management-network
- Contains: FastAPI, Next.js, Caddy
- Externally accessible
- Users interact with the lab through this network

### Wazuh Bridge
- Wazuh Manager is attached to both `lab-network` and `soc-network`
- Collects logs from agents in the lab, writes them to OpenSearch

## Log Flow

```
Ubuntu Target / Samba AD
    │ Wazuh Agent
    ▼
Wazuh Manager  (via lab-network)
    │
    ▼
OpenSearch     (via soc-network)
    │
    ▼
OpenSearch Dashboards → User
```

When a container starts, the entrypoint script runs and automatically registers the Wazuh agent with the Manager. No manual intervention required.

## Scenario Flow

```
1. User selects a scenario in the web UI
2. Next.js → POST /scenario/{name}/start to FastAPI
3. FastAPI → runs docker compose with the scenario override file
4. Ansible playbook → injects vulnerability, configures agents
5. FastAPI → returns "lab ready" with connection details
6. User enters the Kali terminal, follows the attack guide in the web UI
7. FastAPI polls the Wazuh API
8. When the scenario-specific alert fires → returns "success"
```

## Scenario Structure

Each scenario is fully self-contained in its own directory:

```
scenarios/[scenario-name]/
├── docker-compose.override.yml  # scenario-specific container config
├── ansible/                     # playbook that injects the vulnerability
├── wazuh-rules/                 # scenario-specific SIEM detection rules
├── attack/                      # step-by-step attack guide for the user
├── success-criteria.json        # alert rule IDs that trigger success state
└── README.md                    # attack explanation and defensive notes
```

## Components

### Wazuh
- Version: 4.x
- Log collection, correlation, alert generation
- Integrates natively with OpenSearch
- Per-scenario rules loaded at lab start

### OpenSearch
- Officially supported search engine for Wazuh
- Heap: 4GB (configurable via `.env` → `OPENSEARCH_HEAP`)
- Apache 2.0 licensed fork of Elasticsearch

### Samba AD
- Active Directory implementation running on Linux
- Supports Kerberoasting, Pass-the-Hash, DCSync, Brute Force scenarios
- No Windows license required

### Kali Linux
- Pre-installed tools: Impacket, Hashcat, Nmap, SQLmap, CrackMapExec
- Network access restricted to `lab-network` only — no internet egress

### FastAPI
- Endpoints: start, stop, reset per scenario
- Polls Wazuh API for scenario-specific alert detection
- Manages containers via Docker SDK (not subprocess)

### Next.js
- Scenario cards (difficulty, estimated duration, description)
- Lab status (starting, ready, running)
- Connection details (Kali terminal access, Wazuh Dashboard link)
- Step-by-step attack guide
- Alert feed summary
- Lab reset button

### Caddy
- Reverse proxy for Next.js and FastAPI under a single domain
- Automatic HTTPS in production

### Ansible
- Triggered from container entrypoints after boot
- Handles: Wazuh agent registration, Samba AD user/SPN setup, vulnerability injection

## Portability

- All configuration in `.env` — no hardcoded values anywhere
- Supports Linux (Ubuntu 24) and WSL2
- Minimum: 16GB RAM, 50GB disk
- Recommended: 32GB RAM, 200GB disk
