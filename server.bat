@echo off
title LinkFlow — Local Server Launcher
color 0A
cls

echo.
echo  =========================================
echo   LinkFlow ^| Local Development Server
echo  =========================================
echo.

REM ── Determine the directory where this .bat lives ──────────────────
set "ROOT=%~dp0"
set "BACKEND=%ROOT%backend"
set "FRONTEND=%ROOT%frontend"
set "PYTHON=%BACKEND%\venv\Scripts\python.exe"
set "UVICORN=%BACKEND%\venv\Scripts\uvicorn.exe"
set "ALEMBIC=%BACKEND%\venv\Scripts\alembic.exe"

REM ── Check Python venv ───────────────────────────────────────────────
echo [1/5] Checking Python virtual environment...
if not exist "%PYTHON%" (
    echo.
    echo  ERROR: Python venv not found at:
    echo         %PYTHON%
    echo.
    echo  Please run the following once to set it up:
    echo    cd backend
    echo    python -m venv venv
    echo    venv\Scripts\pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)
echo        OK — venv found.

REM ── Check Node / npm ────────────────────────────────────────────────
echo [2/5] Checking Node.js...
where npm >nul 2>&1
if errorlevel 1 (
    echo.
    echo  ERROR: npm not found in PATH.
    echo  Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)
echo        OK — npm found.

REM ── Check frontend node_modules ─────────────────────────────────────
echo [3/5] Checking frontend dependencies...
if not exist "%FRONTEND%\node_modules\next" (
    echo        Installing frontend packages ^(first run only^)...
    cd /d "%FRONTEND%"
    call npm install
    if errorlevel 1 (
        echo.
        echo  ERROR: npm install failed. Check your internet connection.
        pause
        exit /b 1
    )
    cd /d "%ROOT%"
)
echo        OK — node_modules present.

REM ── Run Alembic migrations ──────────────────────────────────────────
echo [4/5] Applying database migrations...
cd /d "%BACKEND%"
"%ALEMBIC%" upgrade head >nul 2>&1
if errorlevel 1 (
    echo        WARNING: Migration had an issue ^(may already be up to date^).
) else (
    echo        OK — database schema is up to date.
)
cd /d "%ROOT%"

REM ── Start Backend ───────────────────────────────────────────────────
echo [5/5] Starting servers...
echo.
echo  Starting FastAPI backend on http://localhost:8000 ...
start "LinkFlow Backend (FastAPI)" cmd /k "title LinkFlow Backend ^| http://localhost:8000 && color 0B && cd /d "%BACKEND%" && echo. && echo  LinkFlow Backend starting... && echo  API Docs: http://localhost:8000/docs && echo  Health:   http://localhost:8000/health && echo. && "%UVICORN%" app.main:app --host 0.0.0.0 --port 8000 --reload"

REM ── Wait for backend to come up ─────────────────────────────────────
echo  Waiting for backend to initialize...
timeout /t 4 /nobreak >nul

REM ── Start Frontend ──────────────────────────────────────────────────
echo  Starting Next.js frontend on http://localhost:3000 ...
start "LinkFlow Frontend (Next.js)" cmd /k "title LinkFlow Frontend ^| http://localhost:3000 && color 0E && cd /d "%FRONTEND%" && echo. && echo  LinkFlow Frontend starting... && echo  App: http://localhost:3000 && echo. && npm run dev"

REM ── Wait and open browser ───────────────────────────────────────────
echo  Waiting for frontend to compile...
timeout /t 8 /nobreak >nul

echo  Opening browser...
start "" "http://localhost:3000"

echo.
echo  =========================================
echo   Both servers are now running!
echo.
echo   Frontend  →  http://localhost:3000
echo   Backend   →  http://localhost:8000
echo   API Docs  →  http://localhost:8000/docs
echo   Health    →  http://localhost:8000/health
echo.
echo   Close the two server windows to stop.
echo  =========================================
echo.
pause

