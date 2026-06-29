#!/bin/bash
# Start Cultural Dispatch dev environment
# Backend:  http://localhost:8020
# Frontend: http://localhost:4350

REPO="$(cd "$(dirname "$0")" && pwd)"

# Kill anything already on these ports
lsof -ti :8020 | xargs kill -9 2>/dev/null
lsof -ti :4350 | xargs kill -9 2>/dev/null

echo "Starting backend on :8020..."
cd "$REPO/backend"
source .venv/bin/activate
uvicorn app.main:app --reload --port 8020 &
BACKEND_PID=$!

echo "Starting frontend on :4350..."
cd "$REPO/frontend"
BACKEND_PORT=8020 npm run dev -- --port 4350 &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:8020"
echo "  Frontend: http://localhost:4350"
echo ""
echo "Press Ctrl+C to stop both."

trap "echo 'Stopping...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null" EXIT INT TERM
wait
