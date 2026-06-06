import json
import logging
import time
from pathlib import Path
from typing import Any, Optional

import httpx

logger = logging.getLogger(__name__)


class WazuhService:
    def __init__(self, api_url: str, username: str, password: str) -> None:
        self.api_url = api_url.rstrip("/")
        self.username = username
        self.password = password
        self._token: Optional[str] = None
        self._token_expiry: float = 0.0
        self._token_ttl: float = 840.0  # Wazuh default token lifetime is 900s; refresh at 840s
        logger.warning(
            "WazuhService: SSL verification is DISABLED (verify=False). "
            "Set WAZUH_API_VERIFY_SSL=true and provide CA cert for production use."
        )

    # ── Public API ──────────────────────────────────────────────────────────

    async def get_matching_alert(
        self, success_criteria_path: Path
    ) -> Optional[Any]:
        """Return the first alert matching any rule ID in success-criteria.json, or None."""
        rule_ids = self._load_rule_ids(success_criteria_path)
        if not rule_ids:
            return None

        token = await self._get_token()
        if not token:
            logger.warning("Could not obtain Wazuh JWT token — skipping alert check")
            return None

        return await self._query_alerts(token, rule_ids)

    # ── Internals ───────────────────────────────────────────────────────────

    def _load_rule_ids(self, path: Path) -> list[str]:
        try:
            with open(path) as fh:
                criteria = json.load(fh)
            ids = criteria.get("rule_ids", [])
            return [str(r) for r in ids]
        except FileNotFoundError:
            logger.error("success-criteria.json not found at %s", path)
            return []
        except (json.JSONDecodeError, KeyError) as exc:
            logger.error("Failed to parse %s: %s", path, exc)
            return []

    async def _get_token(self) -> Optional[str]:
        """Return cached JWT token, re-authenticating only when expired."""
        now = time.time()
        if self._token and now < self._token_expiry:
            return self._token

        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(
                    f"{self.api_url}/security/user/authenticate",
                    auth=(self.username, self.password),
                    timeout=10.0,
                )
                if response.status_code == 200:
                    token = response.json().get("data", {}).get("token")
                    if token:
                        self._token = token
                        self._token_expiry = now + self._token_ttl
                        return self._token
                logger.warning(
                    "Wazuh auth returned HTTP %s", response.status_code
                )
        except httpx.RequestError as exc:
            logger.error("Wazuh auth connection error: %s", exc)

        self._token = None
        self._token_expiry = 0.0
        return None

    async def _query_alerts(
        self, token: str, rule_ids: list[str]
    ) -> Optional[Any]:
        """Query /alerts and return the most recent matching alert, or None."""
        # Wazuh query syntax: comma-separated values within a field = OR
        q = f"rule.id={','.join(rule_ids)}"
        try:
            async with httpx.AsyncClient(verify=False) as client:
                response = await client.get(
                    f"{self.api_url}/alerts",
                    headers={"Authorization": f"Bearer {token}"},
                    params={"q": q, "limit": 1, "sort": "-timestamp"},
                    timeout=10.0,
                )
                if response.status_code == 200:
                    items = (
                        response.json()
                        .get("data", {})
                        .get("affected_items", [])
                    )
                    return items[0] if items else None
                logger.warning(
                    "Wazuh /alerts returned HTTP %s", response.status_code
                )
        except httpx.RequestError as exc:
            logger.error("Wazuh alert query error: %s", exc)
        return None
