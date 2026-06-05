from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid

class Organization(BaseModel):
    id: str = None
    name: str
    slug: str
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)

class User(BaseModel):
    id: str = None
    organization_id: str
    email: str
    full_name: str
    role: str = "operator"  # operator | admin | viewer
    created_at: datetime = None

    def __init__(self, **data):
        if not data.get("id"):
            data["id"] = str(uuid.uuid4())
        if not data.get("created_at"):
            data["created_at"] = datetime.utcnow()
        super().__init__(**data)
