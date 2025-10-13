#!/bin/bash

# Health Check Script
# Checks the health of all monitoring endpoints

set -e

# Configuration
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
TIMEOUT=5

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🏥 Health Check - Persian TTS Platform"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Backend URL: $BACKEND_URL"
echo ""

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $name... "
    
    response=$(curl -s -w "\n%{http_code}" --max-time $TIMEOUT "$url" 2>/dev/null || echo "000")
    status_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} (HTTP $status_code)"
        return 0
    else
        echo -e "${RED}✗${NC} (HTTP $status_code)"
        if [ "$status_code" = "000" ]; then
            echo "  Error: Connection failed or timeout"
        fi
        return 1
    fi
}

# Function to check JSON endpoint and display data
check_json_endpoint() {
    local name=$1
    local url=$2
    
    echo ""
    echo -e "${BLUE}━━━ $name ━━━${NC}"
    
    response=$(curl -s --max-time $TIMEOUT "$url" 2>/dev/null)
    
    if [ $? -eq 0 ]; then
        # Pretty print JSON if jq is available
        if command -v jq &> /dev/null; then
            echo "$response" | jq '.'
        else
            echo "$response"
        fi
        echo -e "${GREEN}✓ Success${NC}"
        return 0
    else
        echo -e "${RED}✗ Failed to fetch${NC}"
        return 1
    fi
}

# Basic connectivity check
echo "1️⃣  Basic Connectivity"
echo ""
if check_endpoint "Backend Server" "$BACKEND_URL/health"; then
    BACKEND_UP=true
else
    BACKEND_UP=false
fi

echo ""

if [ "$BACKEND_UP" = false ]; then
    echo -e "${RED}❌ Backend is not responding${NC}"
    echo ""
    echo "Please ensure the backend is running:"
    echo "  cd BACKEND && npm run dev"
    echo ""
    exit 1
fi

# Health checks
echo "2️⃣  Health Endpoints"
echo ""

HEALTH_PASSED=true

if ! check_endpoint "Basic Health" "$BACKEND_URL/health"; then
    HEALTH_PASSED=false
fi

if ! check_endpoint "Detailed Health" "$BACKEND_URL/health/detailed"; then
    HEALTH_PASSED=false
fi

echo ""

# Monitoring endpoints
echo "3️⃣  Monitoring Endpoints"
echo ""

MONITORING_PASSED=true

if ! check_endpoint "System Metrics" "$BACKEND_URL/api/monitoring/system"; then
    MONITORING_PASSED=false
fi

if ! check_endpoint "Performance Metrics" "$BACKEND_URL/api/monitoring/performance"; then
    MONITORING_PASSED=false
fi

if ! check_endpoint "Analytics" "$BACKEND_URL/api/monitoring/analytics"; then
    MONITORING_PASSED=false
fi

echo ""

# Detailed health information
if [ "$HEALTH_PASSED" = true ]; then
    check_json_endpoint "Detailed Health Check" "$BACKEND_URL/health/detailed"
    echo ""
fi

# System metrics
if [ "$MONITORING_PASSED" = true ]; then
    check_json_endpoint "System Metrics" "$BACKEND_URL/api/monitoring/system"
    echo ""
fi

# Final summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ "$HEALTH_PASSED" = true ] && [ "$MONITORING_PASSED" = true ]; then
    echo -e "${GREEN}🎉 All Health Checks Passed!${NC}"
    echo ""
    echo "The monitoring system is fully operational."
    echo ""
    echo "Available endpoints:"
    echo "  - Health: $BACKEND_URL/health"
    echo "  - Detailed Health: $BACKEND_URL/health/detailed"
    echo "  - System Metrics: $BACKEND_URL/api/monitoring/system"
    echo "  - Performance: $BACKEND_URL/api/monitoring/performance"
    echo "  - Analytics: $BACKEND_URL/api/monitoring/analytics"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠️  Some Health Checks Failed${NC}"
    echo ""
    echo "Please check the errors above and ensure all services are running correctly."
    echo ""
    exit 1
fi
