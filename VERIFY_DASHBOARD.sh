#!/bin/bash

# 🔍 DASHBOARD VERIFICATION SCRIPT
# Run this after starting both servers to verify everything works

echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║           🔍 DASHBOARD VERIFICATION CHECKLIST 🔍                 ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

echo -e "${BLUE}📊 Checking Backend API Endpoints...${NC}"
echo ""

# Array of endpoints to check
declare -a endpoints=(
    "/health/detailed"
    "/api/monitoring/system"
    "/api/monitoring/analytics"
    "/api/monitoring/performance"
)

BACKEND_OK=true

for endpoint in "${endpoints[@]}"
do
    echo -n "Checking ${endpoint}... "
    
    if curl -s -f "${BACKEND_URL}${endpoint}" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FAILED${NC}"
        BACKEND_OK=false
    fi
done

echo ""
echo -e "${BLUE}📱 Checking Frontend Server...${NC}"
echo ""

echo -n "Checking frontend server... "
if curl -s -f "${FRONTEND_URL}" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OK${NC}"
    FRONTEND_OK=true
else
    echo -e "${RED}❌ FAILED${NC}"
    FRONTEND_OK=false
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

if [ "$BACKEND_OK" = true ] && [ "$FRONTEND_OK" = true ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED!${NC}"
    echo ""
    echo -e "${GREEN}🎉 Your dashboard is ready!${NC}"
    echo ""
    echo -e "${BLUE}📱 Access your dashboard at:${NC}"
    echo "   🌐 ${FRONTEND_URL}/dashboard"
    echo ""
    echo -e "${BLUE}📋 Manual Verification Checklist:${NC}"
    echo ""
    echo "   ☐ Dashboard loads without errors"
    echo "   ☐ 4 overview cards show data (CPU, Memory, Uptime, Requests)"
    echo "   ☐ Health checks display ✅/❌ status"
    echo "   ☐ CPU chart shows line graph"
    echo "   ☐ Memory chart shows pie/doughnut"
    echo "   ☐ API Analytics section has data"
    echo "   ☐ Performance table has rows"
    echo "   ☐ Refresh button works (top right)"
    echo "   ☐ 'Updated X ago' timestamp shows"
    echo "   ☐ Auto-refresh happens every 10s"
    echo "   ☐ No console errors"
    echo ""
else
    echo -e "${RED}❌ SOME CHECKS FAILED${NC}"
    echo ""
    
    if [ "$BACKEND_OK" = false ]; then
        echo -e "${YELLOW}⚠️  Backend Issues Detected${NC}"
        echo ""
        echo "Troubleshooting steps:"
        echo "1. Make sure backend is running:"
        echo "   cd BACKEND && npm run dev"
        echo ""
        echo "2. Check backend logs for errors"
        echo ""
        echo "3. Verify MongoDB is running (if required)"
        echo ""
    fi
    
    if [ "$FRONTEND_OK" = false ]; then
        echo -e "${YELLOW}⚠️  Frontend Issues Detected${NC}"
        echo ""
        echo "Troubleshooting steps:"
        echo "1. Make sure frontend is running:"
        echo "   cd client && npm run dev"
        echo ""
        echo "2. Check frontend terminal for errors"
        echo ""
        echo "3. Try clearing node_modules and reinstalling:"
        echo "   cd client && rm -rf node_modules && npm install"
        echo ""
    fi
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
