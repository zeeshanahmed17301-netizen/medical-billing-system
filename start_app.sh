#!/bin/bash

# ─────────────────────────────────────────────────────────
#  MedBill - AI Medical Billing System  |  Start Script
# ─────────────────────────────────────────────────────────

BLUE='\033[0;34m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo ""
echo -e "${CYAN}${BOLD} ====================================================${NC}"
echo -e "${CYAN}${BOLD}   MedBill — AI Medical Billing System${NC}"
echo -e "${CYAN}${BOLD} ====================================================${NC}"
echo ""

# ── Check Python ──────────────────────────────────────────
if ! command -v python3 &>/dev/null; then
    echo -e "${RED}[ERROR] Python 3 not found.${NC}"
    echo "Install from https://python.org"
    exit 1
fi

# ── Check Node ────────────────────────────────────────────
if ! command -v node &>/dev/null; then
    echo -e "${RED}[ERROR] Node.js not found.${NC}"
    echo "Install from https://nodejs.org"
    exit 1
fi

echo -e "${GREEN}[OK]${NC} Python $(python3 --version | cut -d' ' -f2)"
echo -e "${GREEN}[OK]${NC} Node $(node --version)"

# ── Check Tesseract (optional but recommended) ────────────
if command -v tesseract &>/dev/null; then
    echo -e "${GREEN}[OK]${NC} Tesseract OCR found"
else
    echo -e "${YELLOW}[WARN]${NC} Tesseract not found — OCR features won't work"
    echo "       Install: brew install tesseract  (Mac)"
    echo "                sudo apt install tesseract-ocr  (Linux)"
fi

echo ""

# ── Backend venv setup ────────────────────────────────────
cd "$ROOT_DIR/backend"

if [ ! -d "venv" ]; then
    echo -e "${BLUE}[SETUP]${NC} Creating Python virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

if ! python3 -c "import fastapi" &>/dev/null; then
    echo -e "${BLUE}[SETUP]${NC} Installing backend dependencies (first run ~2 min)..."
    pip install -r requirements.txt -q
fi

# ── Copy .env if missing ──────────────────────────────────
if [ ! -f ".env" ]; then
    echo -e "${BLUE}[SETUP]${NC} Creating .env from template..."
    cp .env.example .env
    echo ""
    echo -e "${YELLOW}*** IMPORTANT ***${NC}"
    echo "Open backend/.env and add your ANTHROPIC_API_KEY"
    echo "for AI features (extraction, validation, denials) to work."
    echo -e "${YELLOW}*****************${NC}"
    echo ""
    sleep 3
fi

# ── Frontend deps ─────────────────────────────────────────
cd "$ROOT_DIR/frontend"

if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}[SETUP]${NC} Installing frontend dependencies (first run ~1 min)..."
    npm install --silent
fi

# ── Print startup info ────────────────────────────────────
echo ""
echo -e "${BOLD} Starting MedBill...${NC}"
echo -e " ─────────────────────────────────────────"
echo -e " ${GREEN}Backend API ${NC} →  http://localhost:8000"
echo -e " ${GREEN}Frontend App${NC} →  http://localhost:3000"
echo -e " ${GREEN}API Docs    ${NC} →  http://localhost:8000/api/docs"
echo -e " ─────────────────────────────────────────"
echo -e " Press ${BOLD}Ctrl+C${NC} to stop both servers"
echo ""

# ── Cleanup on exit ───────────────────────────────────────
cleanup() {
    echo ""
    echo -e "${YELLOW}Stopping MedBill...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo -e "${GREEN}Done. Goodbye!${NC}"
    exit 0
}
trap cleanup SIGINT SIGTERM

# ── Start backend ─────────────────────────────────────────
cd "$ROOT_DIR/backend"
source venv/bin/activate
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# ── Wait for backend to be ready ─────────────────────────
echo -e "${BLUE}[INFO]${NC} Waiting for backend to start..."
for i in {1..20}; do
    if curl -s http://localhost:8000/api/health &>/dev/null; then
        echo -e "${GREEN}[OK]${NC} Backend is up!"
        break
    fi
    sleep 1
done

# ── Start frontend ────────────────────────────────────────
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# ── Open browser ─────────────────────────────────────────
sleep 3
echo -e "${BLUE}[INFO]${NC} Opening browser..."
if command -v xdg-open &>/dev/null; then
    xdg-open http://localhost:3000
elif command -v open &>/dev/null; then
    open http://localhost:3000
fi

echo ""
echo -e "${GREEN}${BOLD}MedBill is running!${NC}"
echo -e "Go to ${CYAN}http://localhost:3000${NC} in your browser"
echo ""

# ── Keep alive ────────────────────────────────────────────
wait $BACKEND_PID $FRONTEND_PID
