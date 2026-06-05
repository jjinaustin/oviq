from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime
from enum import Enum
import uuid

class AIActionType(str, Enum):
    CARRIER_CONTACTED = "carrier_contacted"
    CUSTOMER_NOTIFIED = "customer_notified"
    FOLLOWUP_SCHEDULED = "followup_scheduled"
    ETA_REQUESTED = "eta_requested"
    CASE_ESCALATED = "case_escalated"
    EXCEPTION_DETECTED = "exception_detected"
    PLAYBOOK_SELECTED = "playbook_selected"
    EMAIL_DRAFTED = "email_drafted"
    CASE_RESOLVED = "case_resolved"

class AIActionStatus(str, Enum):
    PENDING = "pending"
    EXECUTED = "executed"
    FAILED = "failed"
    SKIPPED = "skipped"

class AIAction(BaseModel):
    id: str = None
    case_id: str
    action_type: AIActionType
    status: AIActionStatus = AIActionStatus.PENDING
    executed_at: Optional[datetime]
    input_data: Optional[Dict[str, Any]] = {}
    output_data: Optional[Dict[str, Any]] = {}
    confidence_score: Optional[float]   # 0.0 - 1.0
    model_used: Optional[str]
    error_message: Optional[str]
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
