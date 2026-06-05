# Oviq — Local Full Stack Setup

## Prerequisites

Make sure you have these installed before starting:

| Tool | Version | Check |
|---|---|---|
| Node.js | 18+ | `node --version` |
| Python | 3.11+ | `python3 --version` |
| pip | latest | `pip3 --version` |
| Git | any | `git --version` |

---

## Step 1 — Clone / unzip the project

If you downloaded the archive:
```bash
tar -xzf exceptionos-full.tar.gz
cd project
```

Your structure should look like:
```
project/
├── frontend/
├── backend/
├── shared/
├── docs/
├── scripts/
├── infra/
└── marketing/
```

---

## Step 2 — Supabase

### 2a. Create a project
1. Go to https://supabase.com → New Project
2. Name: `oviq`
3. Region: US East (or nearest to you)
4. Save your database password somewhere safe

### 2b. Run migrations
In the Supabase dashboard → **SQL Editor**, run in order:

**Migration 1:**
Copy the full contents of `infra/migrations/001_initial_schema.sql` → Run

**Migration 2:**
Copy the full contents of `infra/migrations/002_rls_policies.sql` → Run

### 2c. Get your keys
Go to **Project Settings → API**:

| Value | Where | Variable |
|---|---|---|
| Project URL | "Project URL" | `SUPABASE_URL` |
| anon public | "Project API keys" | `SUPABASE_ANON_KEY` |
| service_role | "Project API keys" ⚠️ | `SUPABASE_SERVICE_KEY` |

---

## Step 3 — Get your API keys

You'll need:

| Service | Where to get it | Variable |
|---|---|---|
| Anthropic | https://console.anthropic.com → API Keys | `ANTHROPIC_API_KEY` |
| Resend | https://resend.com → API Keys (free tier fine) | `RESEND_API_KEY` |

---

## Step 4 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Open `.env` and fill in:

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_KEY=eyJhbGci...

ANTHROPIC_API_KEY=sk-ant-api03-...
OPENAI_API_KEY=                        # optional, leave blank for now

RESEND_API_KEY=re_...
EMAIL_FROM=ops@yourdomain.com

SECRET_KEY=any-random-32-char-string-here
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

### Install Python dependencies

```bash
# still inside /backend
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Start the backend

```bash
uvicorn app.main:app --reload --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Verify backend + DB connection

Open a new terminal tab and run:
```bash
curl http://localhost:8000/health
# → {"status":"ok","version":"0.1.0"}

curl http://localhost:8000/health/db
# → {"status":"ok","db":"connected"}
```

If `/health/db` returns an error, double-check your `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `.env`.

---

## Step 5 — Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

`.env.local` should contain:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Install Node dependencies

```bash
npm install
```

### Start the frontend

```bash
npm run dev
```

You should see:
```
▲ Next.js 14.x.x
- Local: http://localhost:3000
```

---

## Step 6 — Seed demo data

With the backend running, open a new terminal:

```bash
cd backend
source .venv/bin/activate
python ../scripts/seed_demo.py
```

Expected output:
```
Seeding demo data...
  + Organization: <uuid>
  + LOAD-1001 (pending) → 1 case(s)
  + LOAD-1002 (in_transit) → 1 case(s)
  + LOAD-1003 (delayed) → 1 case(s)
  + LOAD-1004 (pending) → no exceptions
  + LOAD-1005 (delivered) → no exceptions

Done. Run backend + frontend to see demo data.
```

---

## Step 7 — Open the app

Visit **http://localhost:3000**

You should see:
- Dashboard with stat cards showing cases
- "Requires Human Action" section with exception cases
- Sidebar with Oviq wordmark and nav

### Test the CSV import

1. Go to **Import** in the sidebar
2. Create a test CSV with these columns:
   ```
   Load ID,Customer,Carrier,Origin,Destination,Pickup Date,Delivery Date,Status
   LOAD-2001,Test Corp,Fast Freight,Chicago IL,Detroit MI,2024-01-01,2024-01-02,pending
   ```
3. Upload it — you should see cases created for overdue loads

---

## Verification checklist

```
[ ] Backend starts without errors
[ ] GET /health returns {"status":"ok"}
[ ] GET /health/db returns {"status":"ok","db":"connected"}
[ ] Frontend loads at localhost:3000
[ ] Seed script runs without errors
[ ] Dashboard shows cases
[ ] Case detail page loads with timeline
[ ] CSV upload returns shipments_created > 0
```

---

## Running both services — quick reference

Terminal 1 (backend):
```bash
cd backend && source .venv/bin/activate && uvicorn app.main:app --reload
```

Terminal 2 (frontend):
```bash
cd frontend && npm run dev
```

Terminal 3 (optional, for scripts):
```bash
cd backend && source .venv/bin/activate
```

---

## Common errors

### `ModuleNotFoundError: No module named 'app'`
You're running uvicorn from the wrong directory. Must be run from inside `/backend`.

### `SUPABASE_URL and SUPABASE_SERVICE_KEY must be set`
Your `.env` file isn't being found. Make sure it exists at `backend/.env` (not `project/.env`).

### `relation "cases" does not exist`
The migration hasn't been run. Go to Supabase SQL Editor and run `001_initial_schema.sql`.

### `CORS error` in browser console
Make sure `FRONTEND_URL=http://localhost:3000` is in `backend/.env` and restart uvicorn.

### `Failed to fetch` in the frontend
Backend isn't running, or `NEXT_PUBLIC_API_URL` in `frontend/.env.local` doesn't match the backend port.

### Port already in use
```bash
# Kill whatever is on port 8000
lsof -ti:8000 | xargs kill -9
# Or run backend on a different port
uvicorn app.main:app --reload --port 8001
# Then update frontend/.env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8001
```
