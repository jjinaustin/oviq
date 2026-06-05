from fastapi import APIRouter
from app.db.client import get_supabase

router = APIRouter()

@router.get("/{case_id}")
async def get_case_timeline(case_id: str):
    db = get_supabase()
    result = db.table("events").select("*").eq("case_id", case_id).order("created_at").execute()
    return result.data
