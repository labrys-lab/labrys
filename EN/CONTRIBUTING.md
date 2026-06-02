# Contributing

## Prerequisites
- Linux (Ubuntu 24) or WSL2
- Docker and Docker Compose installed
- Git configured
- Minimum 16GB RAM, 50GB free disk space

## Getting Started

```bash
git clone https://github.com/[org]/soc-lab.git
cd soc-lab
cp .env.example .env
bash scripts/setup.sh
docker compose up -d
```

## Git Workflow

- `main` — stable, working branch. Never push directly.
- `dev` — active development branch. All work goes here first.
- Feature branches → `feature/[short-description]`
- Bug fixes → `fix/[short-description]`

```bash
git checkout dev
git pull origin dev
git checkout -b feature/my-feature
# work
git push origin feature/my-feature
# open pull request → dev
```

## Pull Request Rules
- PRs go to `dev`, never directly to `main`
- Every PR must pass `docker compose config` without errors
- Scenario changes must include updated `README.md` inside the scenario folder
- No secrets, hardcoded IPs, or hardcoded paths in any file

## Adding a New Scenario

1. Create the folder structure:
```bash
mkdir -p scenarios/[scenario-name]/{ansible,wazuh-rules,attack}
touch scenarios/[scenario-name]/{docker-compose.override.yml,success-criteria.json,README.md}
```

2. Each scenario folder must contain:
   - `docker-compose.override.yml` — scenario-specific container config
   - `ansible/` — playbook that injects the vulnerability
   - `wazuh-rules/` — detection rules loaded at lab start
   - `attack/` — step-by-step commands the user runs manually in Kali
   - `success-criteria.json` — alert rule IDs that trigger success state
   - `README.md` — attack explanation and defensive notes

3. Validate before committing:
```bash
docker compose -f docker-compose.yml -f scenarios/[scenario-name]/docker-compose.override.yml config
ansible-playbook scenarios/[scenario-name]/ansible/main.yml --syntax-check
```

## Validation Before Every Commit

```bash
docker compose config
docker compose -f docker-compose.yml -f scenarios/[scenario-name]/docker-compose.override.yml config
ansible-playbook --syntax-check [playbook]
```

## Environment Variables
- Never commit `.env`
- If you add a new variable, add it to `.env.example` with a placeholder value and a comment explaining it

## Code Style
- Python (FastAPI): follow PEP8, use type hints
- JavaScript (Next.js): ESLint must pass
- YAML (Docker, Ansible): 2-space indentation, no tabs

## Security
Read `SECURITY_RULES.md` before writing any code.
If you find a security issue, do not open a public issue — contact the maintainers directly.
