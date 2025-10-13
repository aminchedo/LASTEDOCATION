@echo off
echo ========================================
echo   Persian Chat App - Startup Script
echo ========================================
echo.

echo [1/3] Killing existing node processes...
taskkill /F /IM node.exe 2>nul
if %errorlevel% == 0 (
    echo     ✓ Stopped existing servers
) else (
    echo     ℹ No existing servers found
)
echo.

echo [2/3] Starting Backend Server...
cd /d "%~dp0BACKEND"
start "Backend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo     ✓ Backend starting on http://localhost:3001
echo.

echo [3/3] Starting Frontend Server...
cd /d "%~dp0client"
start "Frontend Server" cmd /k "npm run dev"
timeout /t 5 /nobreak >nul
echo     ✓ Frontend starting on http://localhost:3000
echo.

echo ========================================
echo   Both servers are starting...
echo ========================================
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:3000
echo.
echo Login Credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press any key to open the app in your browser...
pause >nul

start http://localhost:3000

echo.
echo App opened in browser!
echo Close this window to keep servers running.
echo.

