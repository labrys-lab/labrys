from fastapi import HTTPException

ALLOWED_SCENARIOS: frozenset[str] = frozenset({
    "kerberoasting",
    "pass-the-hash",
    "dcsync",
    "brute-force",
    "port-scan",
    "sqli-lfi",
})


def validate_scenario(name: str) -> str:
    if name not in ALLOWED_SCENARIOS:
        raise HTTPException(
            status_code=400,
            detail=(
                f"Invalid scenario '{name}'. "
                f"Allowed values: {sorted(ALLOWED_SCENARIOS)}"
            ),
        )
    return name
