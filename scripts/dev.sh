#!/bin/bash
# Starts backend and frontend in parallel with labeled output

AQUA='\033[0;36m'
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${AQUA}  ◌  Oviq Dev${NC}"
echo ""

# Check .env exists
if [ ! -f "backend/.env" ]; then
  echo "  ✗ backend/.env not found. Run scripts/setup.sh first."
  exit 1
fi

# Check venv exists
if [ ! -d "backend/.venv" ]; then
  echo "  ✗ backend/.venv not found. Run scripts/setup.sh first."
  exit 1
fi

echo "  Starting backend on :8000 and frontend on :3000"
echo "  Press Ctrl+C to stop both."
echo ""

# Start backend
(
  cd backend
  source .venv/bin/activate
  uvicorn app.main:app --reload --port 8000 2>&1 | sed 's/^/[backend] /'
) &
BACKEND_PID=$!

# Give backend a moment to start
sleep 2

# Start frontend
(
  cd frontend
  npm run dev 2>&1 | sed 's/^/[frontend] /'
) &
FRONTEND_PID=$!

# Clean up both on exit
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; echo ''; echo 'Stopped.'" EXIT INT TERM

wait
