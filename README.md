# ExceptionOS

AI-native logistics exception management platform.

## Structure

```
├── frontend/     Next.js 14 + TypeScript + Tailwind
├── backend/      FastAPI + Python
├── shared/       Pydantic models (source of truth)
├── docs/         Architecture, API docs, runbooks
├── scripts/      Dev utilities
└── infra/        DB migrations, deployment config
```

## Quick Start

### Backend
```bash
cd backend
cp .env.example .env   # fill in your keys
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
npm install
npm run dev
```

### Database
Run `infra/migrations/001_initial_schema.sql` in your Supabase SQL editor.

## API Docs
Once backend is running: http://localhost:8000/docs

## Core Concepts

- **Case** — the primary operational object. Every problem is a Case.
- **Exception** — a typed problem attached to a Case (missed pickup, late delivery, etc.)
- **Event** — append-only timeline entry. Never deleted, never mutated.
- **AI Action** — every AI decision logged with input, output, and confidence score.
- **Playbook** — step-by-step resolution workflow triggered per exception type.
