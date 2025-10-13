#!/bin/bash

# API Diagnostic Script
# Tests API connectivity, CORS, and data source endpoints

echo "🔍 API & Data Sources Diagnostic Tool"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKEND_URL="http://localhost:3001"
FRONTEND_URL="http://localhost:3000"

# Test functions
test_endpoint() {
    local name=$1
    local url=$2
    local auth=$3
    
    echo -n "Testing $name... "
    
    if [ -n "$auth" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $auth" "$url" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    if [ "$http_code" -eq 200 ]; then
        echo -e "${GREEN}✓ OK${NC} (HTTP $http_code)"
        return 0
    elif [ "$http_code" -eq 401 ]; then
        echo -e "${YELLOW}⚠ Requires Authentication${NC} (HTTP $http_code)"
        return 1
    else
        echo -e "${RED}✗ FAILED${NC} (HTTP $http_code)"
        return 1
    fi
}

test_cors() {
    local url=$1
    echo -n "Testing CORS headers for $url... "
    
    cors_header=$(curl -s -I -H "Origin: $FRONTEND_URL" "$url" | grep -i "access-control-allow-origin" || true)
    
    if [ -n "$cors_header" ]; then
        echo -e "${GREEN}✓ CORS Enabled${NC}"
        echo "  → $cors_header"
        return 0
    else
        echo -e "${RED}✗ CORS Not Configured${NC}"
        return 1
    fi
}

# Check if backend is running
echo "1. Checking if backend is running..."
if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}✗ Backend is not running${NC}"
    echo ""
    echo "Please start the backend with:"
    echo "  cd BACKEND && npm run dev"
    exit 1
else
    echo -e "${GREEN}✓ Backend is running${NC}"
fi

echo ""
echo "2. Testing Health Endpoints"
echo "----------------------------"
test_endpoint "Backend Health" "$BACKEND_URL/health"
test_endpoint "API Health" "$BACKEND_URL/api/health"

echo ""
echo "3. Testing CORS Configuration"
echo "------------------------------"
test_cors "$BACKEND_URL/health"
test_cors "$BACKEND_URL/api/sources/catalog"

echo ""
echo "4. Testing Data Source Endpoints (No Auth)"
echo "-------------------------------------------"
test_endpoint "Sources Catalog" "$BACKEND_URL/api/sources/catalog"
test_endpoint "TTS Models" "$BACKEND_URL/api/sources/catalog/type/tts"
test_endpoint "Datasets" "$BACKEND_URL/api/sources/catalog/type/dataset"
test_endpoint "Search Catalog" "$BACKEND_URL/api/sources/catalog/search?q=persian"

echo ""
echo "5. Testing Protected Endpoints"
echo "-------------------------------"
echo "Note: These require authentication and will show 401/403"
test_endpoint "Detected Models" "$BACKEND_URL/api/models/detected"
test_endpoint "Downloads List" "$BACKEND_URL/api/sources/downloads"

echo ""
echo "6. Environment Check"
echo "--------------------"

if [ -f "BACKEND/.env" ]; then
    echo -e "${GREEN}✓ BACKEND/.env exists${NC}"
    
    # Check for required variables (without showing values)
    if grep -q "JWT_SECRET=" BACKEND/.env; then
        echo -e "${GREEN}✓ JWT_SECRET is set${NC}"
    else
        echo -e "${RED}✗ JWT_SECRET is not set${NC}"
    fi
    
    if grep -q "CORS_ORIGIN=" BACKEND/.env; then
        cors_value=$(grep "CORS_ORIGIN=" BACKEND/.env | cut -d'=' -f2)
        echo -e "${GREEN}✓ CORS_ORIGIN is set${NC}: $cors_value"
    else
        echo -e "${YELLOW}⚠ CORS_ORIGIN not set (using default)${NC}"
    fi
else
    echo -e "${RED}✗ BACKEND/.env not found${NC}"
    echo "  Create one from BACKEND/.env.example"
fi

echo ""
if [ -f "client/.env" ]; then
    echo -e "${GREEN}✓ client/.env exists${NC}"
    
    if grep -q "VITE_API_BASE_URL=" client/.env; then
        api_url=$(grep "VITE_API_BASE_URL=" client/.env | cut -d'=' -f2)
        echo -e "${GREEN}✓ VITE_API_BASE_URL is set${NC}: $api_url"
    else
        echo -e "${YELLOW}⚠ VITE_API_BASE_URL not set (using default)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ client/.env not found${NC}"
fi

echo ""
echo "7. Directory Structure Check"
echo "----------------------------"

check_dir() {
    local dir=$1
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✓${NC} $dir exists"
    else
        echo -e "${RED}✗${NC} $dir missing (will be created on first use)"
    fi
}

check_dir "models"
check_dir "datasets"
check_dir "downloads"
check_dir "data"
check_dir "logs"
check_dir "logs/downloads"

echo ""
echo "8. Model Catalog Info"
echo "---------------------"

catalog_info=$(curl -s "$BACKEND_URL/api/sources/catalog" 2>/dev/null)
if [ $? -eq 0 ]; then
    total=$(echo "$catalog_info" | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    echo -e "${GREEN}✓ Catalog accessible${NC}"
    echo "  Total models/datasets in catalog: $total"
    
    # Count by type
    tts_count=$(curl -s "$BACKEND_URL/api/sources/catalog/type/tts" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    model_count=$(curl -s "$BACKEND_URL/api/sources/catalog/type/model" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    dataset_count=$(curl -s "$BACKEND_URL/api/sources/catalog/type/dataset" 2>/dev/null | grep -o '"total":[0-9]*' | cut -d':' -f2 || echo "0")
    
    echo "  - TTS Models: $tts_count"
    echo "  - Language Models: $model_count"
    echo "  - Datasets: $dataset_count"
else
    echo -e "${RED}✗ Cannot access catalog${NC}"
fi

echo ""
echo "9. Common Issues & Solutions"
echo "----------------------------"

issues_found=0

# Check if backend is running on wrong port
if ! curl -s "$BACKEND_URL/health" > /dev/null 2>&1; then
    echo -e "${RED}Issue:${NC} Backend not accessible on port 3001"
    echo "  Solution: Check if backend is running: cd BACKEND && npm run dev"
    issues_found=$((issues_found + 1))
fi

# Check CORS
if ! curl -s -I -H "Origin: $FRONTEND_URL" "$BACKEND_URL/health" | grep -qi "access-control-allow-origin"; then
    echo -e "${RED}Issue:${NC} CORS not properly configured"
    echo "  Solution: Add to BACKEND/.env:"
    echo "    CORS_ORIGIN=http://localhost:3000,http://localhost:5173"
    issues_found=$((issues_found + 1))
fi

# Check .env
if [ ! -f "BACKEND/.env" ]; then
    echo -e "${RED}Issue:${NC} BACKEND/.env file missing"
    echo "  Solution: cp BACKEND/.env.example BACKEND/.env"
    issues_found=$((issues_found + 1))
fi

if [ $issues_found -eq 0 ]; then
    echo -e "${GREEN}✓ No common issues detected${NC}"
fi

echo ""
echo "======================================"
echo "Diagnostic Complete!"
echo ""
echo "For detailed troubleshooting, see:"
echo "  - ANALYSIS_ALT_FOIL_FOLDERS_AND_API_TROUBLESHOOTING.md"
echo "  - QUICK_SETUP_GUIDE.md"
echo ""
