@echo off
setlocal

REM =========================
REM Config (edit if needed)
REM =========================
set BACKEND_DIR=backend
set FRONTEND_DIR=client
set BACKEND_PORT=3001
set FRONTEND_URL=http://localhost:3000

REM =========================
REM Pre-checks
REM =========================
where node >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js not found. Install Node 18+ and try again.
  exit /b 1
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] npm not found. Install Node 18+ and try again.
  exit /b 1
)

if not exist "%BACKEND_DIR%" (
  echo [ERROR] "%BACKEND_DIR%" folder not found.
  exit /b 1
)

if not exist "%FRONTEND_DIR%" (
  echo [ERROR] "%FRONTEND_DIR%" folder not found.
  exit /b 1
)

echo.
echo ============================================
echo   Start Backend + Frontend (Windows Batch)
echo   Backend: "%BACKEND_DIR%"  Port: %BACKEND_PORT%
echo   Frontend: "%FRONTEND_DIR%" URL: %FRONTEND_URL%
echo ============================================
echo.

REM =========================
REM Start backend
REM =========================
echo [1/2] Starting backend (port %BACKEND_PORT%)...
start "Backend Server" cmd /k "cd /d %BACKEND_DIR% && npm run dev"

REM Give backend time to start
echo Waiting 10 seconds for backend to start up and stabilize...
timeout /t 10 /nobreak >nul

REM =========================
REM Start frontend
REM =========================
echo [2/2] Starting frontend (dev)...
start "Frontend Server" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"

REM Give frontend time to start
echo Waiting 5 seconds for frontend to initialize...
timeout /t 5 /nobreak >nul

REM =========================
REM Open browser
REM =========================
echo Opening %FRONTEND_URL% ...
start "" "%FRONTEND_URL%"

echo.
echo Done! Two terminals were opened: "Backend Server" and "Frontend Server".
echo If the browser didn't open, navigate to %FRONTEND_URL%
echo.

endlocal