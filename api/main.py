import logging

from fastapi import FastAPI
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from core.rate_limit import limiter
from routers.scenario import router as scenario_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

app = FastAPI(
    title="SOC Lab Scenario Engine",
    description="Manages attack scenario lifecycle and monitors Wazuh alerts.",
    version="1.0.0",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.include_router(scenario_router)


@app.get("/health", tags=["health"])
async def health() -> dict:
    return {"status": "ok"}
