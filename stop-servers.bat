@echo off
echo Stopping Persian Chat Servers...
echo.

echo Stopping Node.js processes...
taskkill /F /IM node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes found to stop.
) else (
    echo Node.js processes stopped successfully.
)

echo.
echo Stopping npm processes...
taskkill /F /IM npm.exe 2>nul
if errorlevel 1 (
    echo No npm processes found to stop.
) else (
    echo npm processes stopped successfully.
)

echo.
echo All servers stopped.
pause
