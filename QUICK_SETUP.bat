@echo off
REM Quick Setup Script for ML Training Platform (Windows)
REM This script installs dependencies and prepares the project for development

echo ==================================
echo 🚀 ML Training Platform Setup
echo ==================================
echo.

REM Check if we're in the right directory
if not exist "PROJECT_AUDIT_REPORT.md" (
    echo Error: Please run this script from the workspace root directory
    exit /b 1
)

echo Step 1/4: Checking environment files...
if not exist "BACKEND\.env" (
    echo BACKEND/.env not found!
    echo Creating from .env.example...
    copy BACKEND\.env.example BACKEND\.env
    echo ⚠️  Please edit BACKEND/.env and set a secure JWT_SECRET
) else (
    echo ✓ BACKEND/.env exists
)

if not exist "client\.env" (
    echo client/.env not found!
    echo Creating from .env.example...
    copy client\.env.example client\.env
) else (
    echo ✓ client/.env exists
)

echo.
echo Step 2/4: Installing backend dependencies...
cd BACKEND
if not exist "node_modules" (
    call npm install
    echo ✓ Backend dependencies installed
) else (
    echo ✓ Backend dependencies already installed
)

echo.
echo Step 3/4: Installing frontend dependencies...
cd ..\client
if not exist "node_modules" (
    call npm install
    echo ✓ Frontend dependencies installed
) else (
    echo ✓ Frontend dependencies already installed
)

cd ..

echo.
echo Step 4/4: Creating required directories...
if not exist "BACKEND\models" mkdir BACKEND\models
if not exist "BACKEND\data\datasets" mkdir BACKEND\data\datasets
if not exist "BACKEND\data\sources" mkdir BACKEND\data\sources
if not exist "BACKEND\artifacts\jobs" mkdir BACKEND\artifacts\jobs
if not exist "BACKEND\logs" mkdir BACKEND\logs
echo ✓ All directories created

echo.
echo ==================================
echo ✅ Setup Complete!
echo ==================================
echo.
echo Default admin credentials:
echo   Email: admin@example.com
echo   Password: admin123
echo.
echo To start the application:
echo.
echo   Terminal 1 (Backend):
echo     cd BACKEND
echo     npm run dev
echo.
echo   Terminal 2 (Frontend):
echo     cd client
echo     npm run dev
echo.
echo Then open: http://localhost:3000
echo.
echo 📚 Read START_HERE_AUDIT_RESULTS.md for more information
echo.

pause
