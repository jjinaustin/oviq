from fastapi import APIRouter
from app.db.client import get_supabase
from typing import Optional

router = APIRouter()

@router.get("/")
async def list_exceptions(case_id: Optional[str] = None):
    db = get_supabase()
    query = db.table("exceptions").select("*")
    if case_id:
        query = query.eq("case_id", case_id)
    result = query.order("detected_at", desc=True).execute()
    return result.data
