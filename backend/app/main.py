from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import shipments, cases, exceptions, events, playbooks, ingest, health

app = FastAPI(title="ExceptionOS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health (no prefix — /health and /health/db)
app.include_router(health.router)

# API routes
app.include_router(ingest.router,     prefix="/api/v1/ingest",     tags=["ingest"])
app.include_router(shipments.router,  prefix="/api/v1/shipments",  tags=["shipments"])
app.include_router(cases.router,      prefix="/api/v1/cases",      tags=["cases"])
app.include_router(exceptions.router, prefix="/api/v1/exceptions", tags=["exceptions"])
app.include_router(events.router,     prefix="/api/v1/events",     tags=["events"])
app.include_router(playbooks.router,  prefix="/api/v1/playbooks",  tags=["playbooks"])
