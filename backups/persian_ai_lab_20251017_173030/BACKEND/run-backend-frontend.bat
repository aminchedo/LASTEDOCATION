@echo off
echo Starting Persian Chat Backend and Frontend Servers...
echo.

REM Check if we're in the correct directory
if not exist "package.json" (
    echo Error: package.json not found. Please run this from the BACKEND directory.
    pause
    exit /b 1
)

REM Check if frontend directory exists
if not exist "..\FRONTEND" (
    echo Error: FRONTEND directory not found. Please ensure FRONTEND is in the parent directory.
    pause
    exit /b 1
)

echo Building backend...
call npm run build
if errorlevel 1 (
    echo Backend build failed!
    pause
    exit /b 1
)

echo.
echo Starting Backend Server...
start "Persian Chat Backend" cmd.exe /K "cd /d %~dp0 && npm start"

echo Waiting 3 seconds for backend to start...
timeout /t 3 /nobreak >nul

echo.
echo Starting Frontend Server...
start "Persian Chat Frontend" cmd.exe /K "cd /d %~dp0\..\FRONTEND && npm start"

echo.
echo Both servers are starting...
echo Backend: http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Press any key to close this window...
pause >nul
