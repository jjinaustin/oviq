from fastapi import APIRouter, HTTPException, BackgroundTasks
from app.db.client import get_supabase
from typing import Optional
from datetime import datetime

router = APIRouter()

@router.get("/")
async def list_cases(status: Optional[str] = None, priority: Optional[str] = None):
    db = get_supabase()
    query = db.table("cases").select("*, shipments(*), exceptions(*)")
    if status:
        query = query.eq("status", status)
    if priority:
        query = query.eq("priority", priority)
    result = query.order("created_at", desc=True).execute()
    return result.data

@router.get("/{case_id}")
async def get_case(case_id: str):
    db = get_supabase()
    result = db.table("cases").select(
        "*, shipments(*), exceptions(*), events(*), tasks(*), communications(*), ai_actions(*)"
    ).eq("id", case_id).single().execute()
    if not result.data:
        raise HTTPException(404, "Case not found")
    return result.data

@router.patch("/{case_id}/resolve")
async def resolve_case(case_id: str, notes: str = ""):
    db = get_supabase()
    result = db.table("cases").update({
        "status": "resolved",
        "resolved_at": datetime.utcnow().isoformat(),
        "resolution_notes": notes,
    }).eq("id", case_id).execute()
    return result.data

@router.post("/{case_id}/run-playbook")
async def run_playbook(case_id: str, background_tasks: BackgroundTasks):
    db = get_supabase()
    case = db.table("cases").select("id, status").eq("id", case_id).single().execute()
    if not case.data:
        raise HTTPException(404, "Case not found")
    if case.data["status"] in ("resolved", "closed"):
        raise HTTPException(400, f"Case is already {case.data['status']}")
    from app.services.playbook_runner import PlaybookRunner
    runner = PlaybookRunner()
    background_tasks.add_task(runner.run_for_case, case_id)
    return {"status": "started", "case_id": case_id, "message": "Playbook running in background"}
