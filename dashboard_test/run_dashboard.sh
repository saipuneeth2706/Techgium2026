#!/bin/bash

# Navigate to backend directory and start it
echo "🚀 Starting VisionOne Backend (FastAPI)..."
cd "$(dirname "$0")/backend"
# Use existing venv if available, else just run (assuming user has packages)
python3 -m venv .venv 2>/dev/null
if [ -f .venv/bin/activate ]; then
  source .venv/bin/activate
  pip install -r requirements.txt --quiet
fi
python3 main.py &
BACKEND_PID=$!

# Navigate to frontend directory and start it
echo "🚀 Starting VisionOne Dashboard UI (Vite)..."
cd "../frontend"
npm install --quiet
npm run dev &
FRONTEND_PID=$!

echo "✅ Dashboard is starting up!"
echo "📍 Backend: http://localhost:8080"
echo "📍 Frontend: http://localhost:5173"
echo "Press Ctrl+C to stop both."

trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
wait
