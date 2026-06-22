from contextlib import asynccontextmanager

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import (auth, billing, cases, contact, events, exceptions,
                             health, ingest, playbooks, shipments)
from app.core.config import settings

# ── Scheduler ────────────────────────────────────────────────────────────────

scheduler = BackgroundScheduler()


def run_report_monitor():
    """Runs hourly — checks that expected TMS reports have arrived."""
    try:
        from app.services.report_monitor import ReportMonitor
        ReportMonitor().run()
    except Exception as e:
        import logging
        logging.getLogger(__name__).error(f"[scheduler] ReportMonitor failed: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Start scheduler on startup
    scheduler.add_job(
        run_report_monitor,
        trigger="interval",
        hours=1,
        id="report_monitor",
        replace_existing=True,
    )
    scheduler.start()
    yield
    # Shutdown scheduler on app stop
    scheduler.shutdown(wait=False)


# ── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="Oviq API", version="0.1.0", lifespan=lifespan)

origins = [
    "http://localhost:3000",
    "https://oviq.io",
    "https://www.oviq.io",
    settings.FRONTEND_URL,
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(auth.router,       prefix="/api/v1/auth",       tags=["auth"])
app.include_router(billing.router,    prefix="/api/v1/billing",    tags=["billing"])
app.include_router(contact.router,    prefix="/api/v1",            tags=["contact"])
app.include_router(ingest.router,     prefix="/api/v1/ingest",     tags=["ingest"])
app.include_router(shipments.router,  prefix="/api/v1/shipments",  tags=["shipments"])
app.include_router(cases.router,      prefix="/api/v1/cases",      tags=["cases"])
app.include_router(exceptions.router, prefix="/api/v1/exceptions", tags=["exceptions"])
app.include_router(events.router,     prefix="/api/v1/events",     tags=["events"])
app.include_router(playbooks.router,  prefix="/api/v1/playbooks",  tags=["playbooks"])
