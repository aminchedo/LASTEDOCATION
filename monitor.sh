#!/bin/bash
# Production monitoring script

set -e

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

ML_URL="${ML_URL:-http://localhost:8000}"
BACKEND_URL="${BACKEND_URL:-http://localhost:3001}"
FRONTEND_URL="${FRONTEND_URL:-http://localhost:3000}"

echo "════════════════════════════════════════════════════════"
echo "           ML PIPELINE HEALTH MONITOR"
echo "════════════════════════════════════════════════════════"
echo ""

# Function to check endpoint
check_endpoint() {
    local name=$1
    local url=$2
    local timeout=${3:-5}
    
    if curl -s -f --max-time $timeout "$url" > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} $name"
        return 0
    else
        echo -e "  ${RED}✗${NC} $name - UNREACHABLE"
        return 1
    fi
}

# Check services
echo "🔍 Checking Services..."
echo ""

all_healthy=true

check_endpoint "ML Service Health" "$ML_URL/health" || all_healthy=false
check_endpoint "Backend API Health" "$BACKEND_URL/api/health" || all_healthy=false
check_endpoint "Frontend" "$FRONTEND_URL" || all_healthy=false

echo ""

# Check ML service endpoints
echo "🔍 Checking ML Endpoints..."
echo ""

check_endpoint "ML Models List" "$ML_URL/models/list" || all_healthy=false

echo ""

# Check backend proxy endpoints
echo "🔍 Checking Backend Proxy..."
echo ""

check_endpoint "Backend Models Proxy" "$BACKEND_URL/api/models/list" || all_healthy=false

echo ""

# Check system resources (if running in Docker)
if command -v docker &> /dev/null; then
    echo "📊 Docker Container Stats..."
    echo ""
    
    if docker ps | grep -q "ml_service"; then
        echo "  ML Service:"
        docker stats ml_service --no-stream --format "    CPU: {{.CPUPerc}}  Memory: {{.MemUsage}}"
    fi
    
    if docker ps | grep -q "backend"; then
        echo "  Backend:"
        docker stats backend --no-stream --format "    CPU: {{.CPUPerc}}  Memory: {{.MemUsage}}"
    fi
    
    if docker ps | grep -q "client"; then
        echo "  Frontend:"
        docker stats client --no-stream --format "    CPU: {{.CPUPerc}}  Memory: {{.MemUsage}}"
    fi
    
    echo ""
fi

# Check ML artifacts
echo "📁 Checking ML Artifacts..."
echo ""

if [ -d "ml_service/models" ]; then
    model_count=$(find ml_service/models -name "*.pkl" 2>/dev/null | wc -l)
    echo "  Trained models: $model_count"
    
    if [ -f "ml_service/jobs.db" ]; then
        db_size=$(du -h ml_service/jobs.db | cut -f1)
        echo "  Database size: $db_size"
    fi
fi

echo ""

# Check logs for errors (if available)
if [ -d "ml_service/logs" ]; then
    recent_errors=$(find ml_service/logs -type f -mtime -1 -exec grep -i "error" {} \; 2>/dev/null | wc -l)
    if [ $recent_errors -gt 0 ]; then
        echo -e "${YELLOW}⚠${NC}  Found $recent_errors errors in logs (last 24h)"
    fi
fi

echo "════════════════════════════════════════════════════════"

if [ "$all_healthy" = true ]; then
    echo -e "${GREEN}✅ ALL SYSTEMS OPERATIONAL${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME SERVICES ARE DOWN${NC}"
    exit 1
fi
