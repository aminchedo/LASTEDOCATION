#!/bin/bash

# Quick Setup Script for ML Training Platform
# This script installs dependencies and prepares the project for development

set -e

echo "=================================="
echo "🚀 ML Training Platform Setup"
echo "=================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "PROJECT_AUDIT_REPORT.md" ]; then
    echo -e "${RED}Error: Please run this script from the workspace root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1/4: Checking environment files...${NC}"
if [ ! -f "BACKEND/.env" ]; then
    echo -e "${RED}Error: BACKEND/.env not found!${NC}"
    echo "Creating from .env.example..."
    cp BACKEND/.env.example BACKEND/.env
    echo -e "${YELLOW}⚠️  Please edit BACKEND/.env and set a secure JWT_SECRET${NC}"
else
    echo -e "${GREEN}✓ BACKEND/.env exists${NC}"
fi

if [ ! -f "client/.env" ]; then
    echo -e "${RED}Error: client/.env not found!${NC}"
    echo "Creating from .env.example..."
    cp client/.env.example client/.env
else
    echo -e "${GREEN}✓ client/.env exists${NC}"
fi

echo ""
echo -e "${YELLOW}Step 2/4: Installing backend dependencies...${NC}"
cd BACKEND
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi

echo ""
echo -e "${YELLOW}Step 3/4: Installing frontend dependencies...${NC}"
cd ../client
if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

cd ..

echo ""
echo -e "${YELLOW}Step 4/4: Creating required directories...${NC}"
mkdir -p BACKEND/models
mkdir -p BACKEND/data/datasets
mkdir -p BACKEND/data/sources
mkdir -p BACKEND/artifacts/jobs
mkdir -p BACKEND/logs
echo -e "${GREEN}✓ All directories created${NC}"

echo ""
echo "=================================="
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo "=================================="
echo ""
echo "Default admin credentials:"
echo "  Email: admin@example.com"
echo "  Password: admin123"
echo ""
echo "To start the application:"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd BACKEND && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd client && npm run dev"
echo ""
echo "Then open: http://localhost:3000"
echo ""
echo "📚 Read START_HERE_AUDIT_RESULTS.md for more information"
echo ""
