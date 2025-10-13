#!/bin/bash

# 🚀 DASHBOARD STARTUP SCRIPT
# This script helps you start both backend and frontend servers

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║              🚀 STARTING MONITORING DASHBOARD 🚀                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -d "BACKEND" ] || [ ! -d "client" ]; then
    echo -e "${RED}❌ Error: Must run from workspace root directory${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

echo -e "${BLUE}📋 Pre-flight checks...${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Node.js installed: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✅ npm installed: $(npm --version)${NC}"

# Check if backend dependencies are installed
if [ ! -d "BACKEND/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not installed${NC}"
    echo -e "${BLUE}Installing backend dependencies...${NC}"
    cd BACKEND && npm install && cd ..
fi
echo -e "${GREEN}✅ Backend dependencies installed${NC}"

# Check if frontend dependencies are installed
if [ ! -d "client/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Frontend dependencies not installed${NC}"
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    cd client && npm install && cd ..
fi
echo -e "${GREEN}✅ Frontend dependencies installed${NC}"

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ All pre-flight checks passed!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}📝 NEXT STEPS:${NC}"
echo ""
echo -e "${BLUE}1️⃣  Open Terminal 1 and run:${NC}"
echo "   cd $(pwd)/BACKEND"
echo "   npm run dev"
echo ""
echo -e "${BLUE}2️⃣  Open Terminal 2 and run:${NC}"
echo "   cd $(pwd)/client"
echo "   npm run dev"
echo ""
echo -e "${BLUE}3️⃣  Open your browser:${NC}"
echo "   http://localhost:3000/dashboard"
echo ""
echo -e "${GREEN}🎉 Your dashboard will be ready in ~30 seconds!${NC}"
echo ""
