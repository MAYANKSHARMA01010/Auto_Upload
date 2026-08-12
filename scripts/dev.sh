#!/usr/bin/env bash

# Exit on error
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Auto-source NVM if available and Node version < 20
export NVM_DIR="$HOME/.nvm"
if [ -s "$NVM_DIR/nvm.sh" ]; then
    . "$NVM_DIR/nvm.sh" >/dev/null 2>&1 || true
    CURRENT_NODE_MAJOR=$(node -v 2>/dev/null | cut -d'.' -f1 | sed 's/v//')
    if [ -z "$CURRENT_NODE_MAJOR" ] || [ "$CURRENT_NODE_MAJOR" -lt 20 ]; then
        nvm use 22 >/dev/null 2>&1 || nvm use 20 >/dev/null 2>&1 || nvm use default >/dev/null 2>&1 || true
    fi
fi

USE_TERMS=false
ONLY_BACKEND=false
ONLY_FRONTEND=false

for arg in "$@"; do
    case $arg in
        --terms|-t)
            USE_TERMS=true
            ;;
        --backend|-b)
            ONLY_BACKEND=true
            ;;
        --frontend|-f)
            ONLY_FRONTEND=true
            ;;
    esac
done

echo "🚀 [Dev Master Script] Preparing Auto_Upload (ClipScheduler) suite..."

# 0. Kill any process occupying ports based on mode
if [ "$ONLY_BACKEND" = true ]; then
    PORTS=(8000)
elif [ "$ONLY_FRONTEND" = true ]; then
    PORTS=(3000)
else
    PORTS=(3000 8000)
fi

echo "🧹 [0/3] Checking and freeing ports ${PORTS[*]}..."
for PORT in "${PORTS[@]}"; do
    PIDS=$(lsof -ti:$PORT 2>/dev/null || true)
    if [ -n "$PIDS" ]; then
        echo "  ⚠️ Port $PORT is occupied by PID(s): $PIDS. Terminating..."
        kill -9 $PIDS 2>/dev/null || true
    fi
done
rm -f "$ROOT_DIR/pnpm-lock.yaml"

# 1. Backend Mode Only
if [ "$ONLY_BACKEND" = true ]; then
    echo "🐍 [Backend Mode] Preparing Python Virtual Environment..."
    cd "$ROOT_DIR/backend"
    if [ ! -d ".venv" ]; then
        echo "Creating Python virtualenv (.venv)..."
        python3.12 -m venv .venv || python3 -m venv .venv
    fi
    source .venv/bin/activate
    echo "Checking & installing Python requirements..."
    python -m pip install -q -r requirements.txt
    echo "✨ Launching Backend ONLY on http://localhost:8000 ..."
    exec uvicorn main:app --reload --port 8000
fi

# 2. Frontend Mode Only
if [ "$ONLY_FRONTEND" = true ]; then
    echo "📦 [Frontend Mode] Checking Frontend Dependencies..."
    cd "$ROOT_DIR/frontend"
    if command -v pnpm &> /dev/null; then
        pnpm install
        echo "✨ Launching Frontend ONLY on http://localhost:3000 ..."
        exec pnpm dev
    else
        npm install
        echo "✨ Launching Frontend ONLY on http://localhost:3000 ..."
        exec npm run dev
    fi
fi

# 3. Setup Both Backend & Frontend
echo "🐍 [1/3] Preparing Python Virtual Environment for Backend..."
cd "$ROOT_DIR/backend"
if [ ! -d ".venv" ]; then
    echo "Creating Python virtualenv (.venv)..."
    python3.12 -m venv .venv || python3 -m venv .venv
fi
source .venv/bin/activate
echo "Checking & installing Python requirements..."
python -m pip install -q -r requirements.txt

echo "📦 [2/3] Checking Frontend Dependencies..."
cd "$ROOT_DIR/frontend"
if command -v pnpm &> /dev/null; then
    pnpm install
else
    npm install
fi

# 4. Launch Both Services
if [ "$USE_TERMS" = true ]; then
    echo "🖥️ [3/3] Launching services in separate macOS Terminal windows..."
    osascript -e 'tell application "Terminal" to do script "cd \"'$ROOT_DIR'/backend\" && source .venv/bin/activate && uvicorn main:app --reload --port 8000"' >/dev/null
    sleep 2
    if command -v pnpm &> /dev/null; then
        osascript -e 'tell application "Terminal" to do script "cd \"'$ROOT_DIR'/frontend\" && pnpm dev"' >/dev/null
    else
        osascript -e 'tell application "Terminal" to do script "cd \"'$ROOT_DIR'/frontend\" && npm run dev"' >/dev/null
    fi
else
    echo "✨ [3/3] Launching Backend (8000) & Frontend (3000) using concurrently..."
    cd "$ROOT_DIR"
    if command -v pnpm &> /dev/null; then
        pnpm dlx concurrently@8 \
          --names "BACKEND,FRONTEND" \
          --prefix-colors "cyan,magenta" \
          --kill-others-on-fail \
          "cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000" \
          "sleep 1 && cd frontend && pnpm dev"
    else
        npx -y concurrently@8 \
          --names "BACKEND,FRONTEND" \
          --prefix-colors "cyan,magenta" \
          --kill-others-on-fail \
          "cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000" \
          "sleep 1 && cd frontend && npm run dev"
    fi
fi

