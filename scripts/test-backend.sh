#!/bin/bash

echo "🔍 PHASE 2: BACKEND FUNCTIONALITY VERIFICATION"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if backend is running
if ! curl -s http://localhost:3001/health > /dev/null; then
    echo -e "${RED}❌ Backend is not running!${NC}"
    echo "Please start backend with: cd BACKEND && npm run dev"
    exit 1
fi

echo -e "${GREEN}✅ Backend is running${NC}"
echo ""

# Test Health Endpoint
echo "Testing /health endpoint..."
HEALTH=$(curl -s http://localhost:3001/health)
if echo "$HEALTH" | grep -q "success"; then
    echo -e "${GREEN}✅ /health endpoint working${NC}"
else
    echo -e "${RED}❌ /health endpoint failed${NC}"
fi

# Test Detailed Health
echo "Testing /health/detailed endpoint..."
HEALTH_DETAILED=$(curl -s http://localhost:3001/health/detailed)
if echo "$HEALTH_DETAILED" | grep -q "checks"; then
    echo -e "${GREEN}✅ /health/detailed endpoint working${NC}"
else
    echo -e "${RED}❌ /health/detailed endpoint failed${NC}"
fi

# Test System Monitoring
echo "Testing /api/monitoring/system endpoint..."
SYSTEM=$(curl -s http://localhost:3001/api/monitoring/system)
if echo "$SYSTEM" | grep -q "cpu"; then
    echo -e "${GREEN}✅ System monitoring endpoint working${NC}"
else
    echo -e "${RED}❌ System monitoring endpoint failed${NC}"
fi

# Test Analytics
echo "Testing /api/monitoring/analytics endpoint..."
ANALYTICS=$(curl -s http://localhost:3001/api/monitoring/analytics)
if echo "$ANALYTICS" | grep -q "total"; then
    echo -e "${GREEN}✅ Analytics endpoint working${NC}"
else
    echo -e "${RED}❌ Analytics endpoint failed${NC}"
fi

# Test Performance
echo "Testing /api/monitoring/performance endpoint..."
PERFORMANCE=$(curl -s http://localhost:3001/api/monitoring/performance)
if echo "$PERFORMANCE" | grep -q "success"; then
    echo -e "${GREEN}✅ Performance endpoint working${NC}"
else
    echo -e "${RED}❌ Performance endpoint failed${NC}"
fi

# Test Static Files
echo "Testing static file serving..."
DASHBOARD=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/dashboard.html)
if [ "$DASHBOARD" = "200" ]; then
    echo -e "${GREEN}✅ Static files being served correctly${NC}"
else
    echo -e "${RED}❌ Static files not accessible${NC}"
fi

echo ""
echo -e "${GREEN}🎉 BACKEND VERIFICATION COMPLETE!${NC}"
