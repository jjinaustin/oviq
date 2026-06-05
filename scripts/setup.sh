#!/bin/bash
set -e

GREEN='\033[0;32m'
AQUA='\033[0;36m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_step() { echo -e "\n${AQUA}▸ $1${NC}"; }
print_ok()   { echo -e "${GREEN}  ✓ $1${NC}"; }
print_warn() { echo -e "${YELLOW}  ⚠ $1${NC}"; }
print_err()  { echo -e "${RED}  ✗ $1${NC}"; }

echo ""
echo -e "${AQUA}  ◌  Oviq — Local Setup${NC}"
echo -e "  ─────────────────────────"
echo ""

# ── Check we're in the right place ──────────────────────
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
  print_err "Run this script from the project root (where /backend and /frontend live)"
  exit 1
fi

# ── Check prerequisites ──────────────────────────────────
print_step "Checking prerequisites..."

check_cmd() {
  if command -v $1 &> /dev/null; then
    print_ok "$1 found ($(${1} --version 2>&1 | head -1))"
  else
    print_err "$1 not found — install it before continuing"
    exit 1
  fi
}

check_cmd node
check_cmd python3
check_cmd pip3

# ── Backend setup ────────────────────────────────────────
print_step "Setting up backend..."

cd backend

if [ ! -f ".env" ]; then
  if [ -f ".env.example" ]; then
    cp .env.example .env
    print_warn ".env created from .env.example — fill in your keys before starting"
  else
    print_err ".env.example not found"
    exit 1
  fi
else
  print_ok ".env already exists"
fi

if [ ! -d ".venv" ]; then
  print_step "Creating Python virtual environment..."
  python3 -m venv .venv
  print_ok "Virtual environment created"
else
  print_ok "Virtual environment already exists"
fi

print_step "Installing Python dependencies..."
source .venv/bin/activate
pip install -r requirements.txt -q
print_ok "Python dependencies installed"

cd ..

# ── Frontend setup ───────────────────────────────────────
print_step "Setting up frontend..."

cd frontend

if [ ! -f ".env.local" ]; then
  if [ -f ".env.local.example" ]; then
    cp .env.local.example .env.local
    print_ok ".env.local created"
  fi
else
  print_ok ".env.local already exists"
fi

print_step "Installing Node dependencies..."
npm install --silent
print_ok "Node dependencies installed"

cd ..

# ── Summary ──────────────────────────────────────────────
echo ""
echo -e "${AQUA}  Setup complete.${NC}"
echo ""
echo "  Next steps:"
echo ""
echo "  1. Fill in backend/.env with your Supabase + Anthropic + Resend keys"
echo "  2. Run migrations in Supabase SQL Editor:"
echo "     → infra/migrations/001_initial_schema.sql"
echo "     → infra/migrations/002_rls_policies.sql"
echo ""
echo "  3. Start the backend:"
echo -e "     ${AQUA}cd backend && source .venv/bin/activate && uvicorn app.main:app --reload${NC}"
echo ""
echo "  4. Verify DB connection:"
echo -e "     ${AQUA}curl http://localhost:8000/health/db${NC}"
echo ""
echo "  5. Seed demo data:"
echo -e "     ${AQUA}python ../scripts/seed_demo.py${NC}"
echo ""
echo "  6. Start the frontend (new terminal):"
echo -e "     ${AQUA}cd frontend && npm run dev${NC}"
echo ""
echo "  7. Open http://localhost:3000"
echo ""
