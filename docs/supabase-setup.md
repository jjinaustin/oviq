# Supabase Setup Guide

## 1. Create a project

1. Go to https://supabase.com and sign in
2. Click **New Project**
3. Name it `exceptionos` (or your chosen product name)
4. Set a strong database password — save it somewhere safe
5. Select the region closest to your users (US East for most freight customers)
6. Wait ~2 minutes for provisioning

---

## 2. Run the migrations

In the Supabase dashboard, go to **SQL Editor** and run these in order:

### Migration 1 — Schema
Copy and paste the full contents of:
```
infra/migrations/001_initial_schema.sql
```
Click **Run**. You should see: `Success. No rows returned.`

### Migration 2 — RLS Policies
Copy and paste the full contents of:
```
infra/migrations/002_rls_policies.sql
```
Click **Run**.

---

## 3. Get your keys

In the Supabase dashboard go to **Project Settings → API**.

You need three values:

| Key | Where to find it | Which .env variable |
|---|---|---|
| Project URL | "Project URL" field | `SUPABASE_URL` |
| Anon public key | "Project API keys → anon public" | `SUPABASE_ANON_KEY` |
| Service role key | "Project API keys → service_role" ⚠️ | `SUPABASE_SERVICE_KEY` |

⚠️ The service role key bypasses RLS. Never expose it to the browser or commit it to git.

---

## 4. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_KEY=eyJ...
ANTHROPIC_API_KEY=sk-ant-...
RESEND_API_KEY=re_...
SECRET_KEY=generate-a-random-32-char-string
```

---

## 5. Configure the frontend

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 6. Verify connectivity

Start the backend:
```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Then hit the DB health check:
```
GET http://localhost:8000/health/db
```

Expected response:
```json
{ "status": "ok", "db": "connected" }
```

---

## 7. Seed demo data (optional)

```bash
cd backend
python ../scripts/seed_demo.py
```

This creates:
- 1 demo organization
- 5 shipments (mix of clean and exception-triggering)
- Cases auto-opened for detected exceptions

---

## 8. Start the frontend

```bash
cd frontend
npm install
npm run dev
```

Visit http://localhost:3000

---

## Supabase Table Editor

You can inspect your data directly at:
`https://supabase.com/dashboard/project/<your-project-id>/editor`

Useful for:
- Verifying shipments were created
- Checking events are appending correctly
- Manually tweaking case status during development

---

## Troubleshooting

**`RuntimeError: SUPABASE_URL and SUPABASE_SERVICE_KEY must be set`**
→ Your `.env` file is missing or not being loaded. Make sure you're running uvicorn from inside the `/backend` directory.

**`invalid API key`**
→ Double-check you're using the service role key in the backend, not the anon key.

**`relation "cases" does not exist`**
→ Migration 001 hasn't been run yet, or ran with errors. Check the SQL editor output.

**CORS errors in browser**
→ Make sure `FRONTEND_URL=http://localhost:3000` is set in backend `.env`.
