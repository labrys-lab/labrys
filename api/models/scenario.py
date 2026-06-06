from typing import Any, Optional
from pydantic import BaseModel


class ScenarioResponse(BaseModel):
    status: str
    scenario: str
    message: Optional[str] = None


class StatusResponse(BaseModel):
    status: str  # "success" | "running" | "idle"
    scenario: str
    alert: Optional[Any] = None
