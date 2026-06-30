@echo off
title MedBill - Medical Billing System
color 0A

echo.
echo  =====================================================
echo    MedBill - AI Medical Billing System
echo  =====================================================
echo.

REM ── Check Python ──────────────────────────────────────
set PYTHON_CMD=python
py --version >nul 2>&1
if not errorlevel 1 (
    set PYTHON_CMD=py
) else (
    python --version >nul 2>&1
    if errorlevel 1 (
        echo  [ERROR] Python not found!
        echo  Please install Python 3.11+ from https://python.org
        pause
        exit /b
    )
)

REM ── Check Node.js ─────────────────────────────────────
node --version >nul 2>&1
if errorlevel 1 (
    echo  [ERROR] Node.js not found!
    echo  Please install Node.js 18+ from https://nodejs.org
    pause
    exit /b
)

echo  [OK] Python found
echo  [OK] Node.js found
echo.

REM ── Setup backend venv if not exists ──────────────────
if not exist "backend\venv" (
    echo  [SETUP] Creating Python virtual environment...
    cd backend
    %PYTHON_CMD% -m venv venv
    cd ..
)

REM ── Install backend deps if needed ────────────────────
if not exist "backend\venv\Lib\site-packages\fastapi" (
    echo  [SETUP] Installing backend dependencies...
    echo  This may take 2-3 minutes on first run...
    cd backend
    call venv\Scripts\activate.bat
    pip install -r requirements.txt --quiet
    cd ..
)

REM ── Install frontend deps if needed ───────────────────
if not exist "frontend\node_modules" (
    echo  [SETUP] Installing frontend dependencies...
    echo  This may take 1-2 minutes on first run...
    cd frontend
    npm install --silent
    cd ..
)

REM ── Copy .env if not exists ───────────────────────────
if not exist "backend\.env" (
    echo  [SETUP] Creating .env from template...
    copy "backend\.env.example" "backend\.env" >nul
    echo.
    echo  *** IMPORTANT ***
    echo  Open backend\.env and add your ANTHROPIC_API_KEY
    echo  for AI features to work.
    echo  ******************
    echo.
    timeout /t 4 >nul
)

echo.
echo  Starting MedBill...
echo  -----------------------------------------------
echo  Backend API  →  http://localhost:8000
echo  Frontend App →  http://localhost:3000
echo  API Docs     →  http://localhost:8000/api/docs
echo  -----------------------------------------------
echo.
echo  Press Ctrl+C in either window to stop.
echo.

REM ── Start backend in new window ───────────────────────
start "MedBill Backend (API)" cmd /k "cd /d %~dp0backend && call venv\Scripts\activate.bat && echo Backend starting... && uvicorn app.main:app --reload --port 8000"

REM ── Wait 3 seconds for backend to initialize ──────────
timeout /t 3 /nobreak >nul

REM ── Start frontend in new window ──────────────────────
start "MedBill Frontend (UI)" cmd /k "cd /d %~dp0frontend && echo Frontend starting... && npm run dev"

REM ── Wait 4 seconds then open browser ─────────────────
timeout /t 4 /nobreak >nul

echo  Opening browser...
start http://localhost:3000

echo.
echo  Both servers are running in separate windows.
echo  Close those windows to stop the app.
echo.
pause
