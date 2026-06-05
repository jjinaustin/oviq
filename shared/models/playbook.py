from pydantic import BaseModel
from typing import Optional, List, Any, Dict
from datetime import datetime
from enum import Enum
import uuid

class PlaybookStep(BaseModel):
    order: int
    action: str                     # "send_email" | "create_task" | "wait" | "escalate"
    owner: str = "ai"               # "ai" | "human"
    config: Optional[Dict[str, Any]] = {}
    delay_minutes: Optional[int]    # wait before executing

class Playbook(BaseModel):
    id: str = None
    organization_id: Optional[str] # None = system default
    name: str
    exception_type: str
    description: Optional[str]
    steps: List[PlaybookStep] = []
    escalation_rules: Optional[Dict[str, Any]] = {}
    enabled: bool = True
    created_at: datetime = None
    updated_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        now = datetime.utcnow()
        if not data.get("created_at"):
            data["created_at"] = now
        data["updated_at"] = now
        super().__init__(**data)
