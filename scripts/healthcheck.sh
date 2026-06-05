#!/bin/bash
GREEN='\033[0;32m'
RED='\033[0;31m'
AQUA='\033[0;36m'
NC='\033[0m'

echo -e "\n${AQUA}  ◌  Oviq Health Check${NC}\n"

check() {
  local label=$1
  local url=$2
  local expected=$3
  
  response=$(curl -s --max-time 3 "$url" 2>/dev/null)
  if echo "$response" | grep -q "$expected"; then
    echo -e "${GREEN}  ✓ ${label}${NC}"
    echo "    $response" | head -1
  else
    echo -e "${RED}  ✗ ${label}${NC}"
    echo "    Expected to find: $expected"
    echo "    Got: ${response:-no response}"
  fi
}

check "Backend liveness"    "http://localhost:8000/health"    '"status":"ok"'
check "Database connection" "http://localhost:8000/health/db" '"db":"connected"'
check "Cases endpoint"      "http://localhost:8000/api/v1/cases" '['
check "Playbooks endpoint"  "http://localhost:8000/api/v1/playbooks" '['

echo ""
echo "  Frontend: http://localhost:3000"
echo "  API docs: http://localhost:8000/docs"
echo ""
