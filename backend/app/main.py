from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api.routes import shipments, cases, exceptions, events, playbooks, ingest, health, auth, billing

app = FastAPI(title="Oviq API", version="0.1.0")

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
app.include_router(auth.router,      prefix="/api/v1/auth",      tags=["auth"])
app.include_router(billing.router,   prefix="/api/v1/billing",   tags=["billing"])
app.include_router(ingest.router,    prefix="/api/v1/ingest",    tags=["ingest"])
app.include_router(shipments.router, prefix="/api/v1/shipments", tags=["shipments"])
app.include_router(cases.router,     prefix="/api/v1/cases",     tags=["cases"])
app.include_router(exceptions.router,prefix="/api/v1/exceptions",tags=["exceptions"])
app.include_router(events.router,    prefix="/api/v1/events",    tags=["events"])
app.include_router(playbooks.router, prefix="/api/v1/playbooks", tags=["playbooks"])
