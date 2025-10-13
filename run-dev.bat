@echo off
echo Starting Persian Chat Development Servers...
echo.

REM Check if BACKEND directory exists
if not exist "BACKEND" (
    echo Error: BACKEND directory not found.
    pause
    exit /b 1
)

REM Check if FRONTEND directory exists
if not exist "FRONTEND" (
    echo Error: FRONTEND directory not found.
    pause
    exit /b 1
)

echo Starting Backend Development Server...
start "Backend Dev Server" cmd.exe /K "cd /d %~dp0BACKEND && npm run dev"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Development Server...
start "Frontend Dev Server" cmd.exe /K "cd /d %~dp0FRONTEND && npm start"

echo.
echo Both development servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
