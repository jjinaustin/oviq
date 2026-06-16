import asyncio
import logging
from datetime import datetime, timezone

from app.core.config import settings
from app.db.client import get_supabase
from app.services.action_executor import ActionExecutor

logger = logging.getLogger(__name__)

# In development, cap delays at 10 seconds so you can test the full
# playbook flow without waiting real minutes. In production, use real delays.
IS_DEV = getattr(settings, "ENVIRONMENT", "production").lower() == "development"


class PlaybookRunner:
    def __init__(self):
        self.db = get_supabase()
        self.executor = ActionExecutor()

    async def run_for_case(self, case_id: str):
        case = self._get_case(case_id)
        if not case:
            return

        shipment = self._get_shipment(case["shipment_id"])
        if not shipment:
            return

        exceptions = self._get_exceptions(case_id)
        if not exceptions:
            return

        exception_type = exceptions[0]["exception_type"]
        playbook = self._get_playbook(exception_type)

        if not playbook:
            self._update_case_status(case_id, "pending_human")
            self._log_event(case_id, shipment["id"], "case.no_playbook",
                "system", f"No playbook found for {exception_type} — assigned to human")
            return

        self.db.table("cases").update({
            "playbook_id": playbook["id"],
            "status": "ai_resolving",
            "assigned_to": "ai",
        }).eq("id", case_id).execute()

        self._log_event(case_id, shipment["id"], "case.ai_resolving",
            "ai", f"Playbook selected: {playbook['name']} — Oviq resolving automatically")

        steps = sorted(playbook.get("steps", []), key=lambda s: s.get("order", 0))

        for step in steps:
            await self._execute_step(step, case_id, case, shipment, exceptions)
            fresh = self._get_case(case_id)
            if fresh and fresh["status"] in ("resolved", "closed", "escalated", "pending_human"):
                return

    async def _execute_step(self, step, case_id, case, shipment, exceptions):
        delay = step.get("delay_minutes", 0)
        action = step.get("action", "")
        owner = step.get("owner", "ai")
        config = step.get("config", {})

        if delay and delay > 0:
            if IS_DEV:
                # Development: cap at 10 seconds so full playbook runs quickly
                sleep_seconds = min(delay * 60, 10)
                self._log_event(case_id, shipment["id"], "step.waiting",
                    "ai", f"[DEV] Waiting {sleep_seconds}s (real: {delay}min) before: {action.replace('_', ' ')}")
            else:
                # Production: real delays as configured in the playbook
                sleep_seconds = delay * 60
                self._log_event(case_id, shipment["id"], "step.waiting",
                    "ai", f"Waiting {delay} minutes before: {action.replace('_', ' ')}")

            await asyncio.sleep(sleep_seconds)

        if owner == "human":
            reason = config.get("reason", "Human action required")
            title = config.get("title", action)
            self._create_human_task(case_id, title, reason)
            self._log_event(case_id, shipment["id"], "task.created",
                "ai", f"Task created for human review: {title}")
            self._maybe_escalate(case_id, shipment["id"], reason)
            return

        if action == "send_email":
            try:
                await self.executor.send_email(
                    case_id=case_id, case=case, shipment=shipment,
                    exceptions=exceptions, template=config.get("template", ""),
                )
            except Exception as e:
                logger.error(f"[playbook] Email step failed for case {case_id}: {e}")
                self._log_event(case_id, shipment["id"], "step.error",
                    "system", f"Email step failed: {str(e)[:200]}")

        elif action == "create_task":
            title = config.get("title", "Follow up")
            self._create_ai_task(case_id, title)
            self._log_event(case_id, shipment["id"], "task.created",
                "ai", f"AI task created: {title}")

        elif action == "escalate":
            reason = config.get("reason", "Escalation threshold reached")
            self._maybe_escalate(case_id, shipment["id"], reason)

    def _maybe_escalate(self, case_id, shipment_id, reason):
        self._update_case_status(case_id, "pending_human")
        self._log_event(case_id, shipment_id, "case.escalated",
            "ai", f"Escalated to human: {reason}")

    def _create_human_task(self, case_id, title, description=""):
        self.db.table("tasks").insert({
            "case_id": case_id,
            "owner": "human",
            "title": title,
            "description": description,
            "status": "pending",
        }).execute()

    def _create_ai_task(self, case_id, title):
        self.db.table("tasks").insert({
            "case_id": case_id,
            "owner": "ai",
            "title": title,
            "status": "pending",
        }).execute()

    def _update_case_status(self, case_id, status):
        update = {"status": status}
        if status == "resolved":
            update["resolved_at"] = datetime.now(timezone.utc).isoformat()
        self.db.table("cases").update(update).eq("id", case_id).execute()

    def _log_event(self, case_id, shipment_id, event_type, actor, summary, payload={}):
        self.db.table("events").insert({
            "case_id": case_id,
            "shipment_id": shipment_id,
            "event_type": event_type,
            "actor": actor,
            "summary": summary,
            "payload": payload,
        }).execute()

    def _get_case(self, case_id):
        r = self.db.table("cases").select("*").eq("id", case_id).single().execute()
        return r.data

    def _get_shipment(self, shipment_id):
        r = self.db.table("shipments").select("*").eq("id", shipment_id).single().execute()
        return r.data

    def _get_exceptions(self, case_id):
        r = self.db.table("exceptions").select("*").eq("case_id", case_id).execute()
        return r.data or []

    def _get_playbook(self, exception_type):
        r = self.db.table("playbooks").select("*") \
            .eq("exception_type", exception_type) \
            .eq("enabled", True) \
            .limit(1).execute()
        return r.data[0] if r.data else None
