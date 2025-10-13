@echo off
echo Starting Persian Chat Application Servers...
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

echo Building Backend...
cd BACKEND
call npm run build
if errorlevel 1 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Starting Backend Server...
start "Persian Chat Backend" cmd.exe /K "cd /d %~dp0BACKEND && npm start"

echo Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Persian Chat Frontend" cmd.exe /K "cd /d %~dp0FRONTEND && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
