#!/bin/bash

# API Testing Script for Persian TTS/AI Platform
# Tests all implemented endpoints

echo "🧪 API Testing Script"
echo "===================="
echo ""

BASE_URL="http://localhost:3001"
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_test() {
    echo -e "${YELLOW}TEST: $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ PASS${NC}"
}

print_error() {
    echo -e "${RED}❌ FAIL: $1${NC}"
}

# Test helper function
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    print_test "$description"
    
    if [ "$method" = "GET" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "PUT" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -d "$data")
    elif [ "$method" = "DELETE" ]; then
        RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')
    
    if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
        print_success
        echo "Response: $(echo $BODY | jq -r '.success // .data.status // "OK"' 2>/dev/null || echo "OK")"
    else
        print_error "HTTP $HTTP_CODE"
        echo "Response: $BODY"
    fi
    
    echo ""
}

echo "Checking if server is running..."
if ! curl -s "$BASE_URL/health" > /dev/null 2>&1; then
    echo "❌ Backend server is not running!"
    echo "Start it with: cd BACKEND && npm run dev"
    exit 1
fi
echo "✅ Server is running"
echo ""

# 1. Health Check
echo "1️⃣  Testing System Endpoints"
echo "----------------------------"
test_endpoint "GET" "/health" "Health check"
test_endpoint "GET" "/api" "API info"

# 2. HuggingFace Search (without auth for testing)
echo ""
echo "2️⃣  Testing HuggingFace Integration (Public)"
echo "--------------------------------------------"
test_endpoint "GET" "/api/sources/search?q=persian" "Search Persian models"

# Note: Most endpoints require authentication
echo ""
echo "3️⃣  Authentication Required Endpoints"
echo "-------------------------------------"
echo "ℹ️  The following endpoints require JWT authentication:"
echo ""
echo "To test authenticated endpoints:"
echo "1. Register a user: POST /api/auth/register"
echo "2. Login: POST /api/auth/login"
echo "3. Use the returned JWT token in Authorization header"
echo ""
echo "Example authenticated request:"
echo "curl -H 'Authorization: Bearer YOUR_JWT_TOKEN' \\"
echo "  http://localhost:3001/api/sources/installed"
echo ""

# Token validation (no auth required)
echo ""
echo "4️⃣  Testing Token Validation"
echo "----------------------------"
echo "ℹ️  To test HuggingFace token validation:"
echo "curl -X POST http://localhost:3001/api/sources/validate-token \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"token\":\"hf_YOUR_TOKEN_HERE\"}'"
echo ""

# Database test
echo ""
echo "5️⃣  Testing Database Connection"
echo "-------------------------------"
echo "Checking database via health endpoint..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/health")
DB_STATUS=$(echo $HEALTH_RESPONSE | jq -r '.data.database' 2>/dev/null)

if [ "$DB_STATUS" = "connected" ]; then
    echo "✅ Database is connected"
else
    echo "❌ Database connection issue"
fi

echo ""
echo "📋 Summary of Available Endpoints"
echo "=================================="
echo ""
echo "Public Endpoints (No Auth):"
echo "  GET  /health"
echo "  GET  /api"
echo "  GET  /api/sources/search?q=query"
echo "  POST /api/sources/validate-token"
echo "  POST /api/auth/register"
echo "  POST /api/auth/login"
echo ""
echo "Protected Endpoints (Require Auth):"
echo ""
echo "HuggingFace Integration:"
echo "  GET    /api/sources/model/:repoId"
echo "  POST   /api/sources/download"
echo "  GET    /api/sources/download/:id"
echo "  DELETE /api/sources/download/:id"
echo "  GET    /api/sources/installed"
echo "  GET    /api/sources/persian/tts"
echo "  GET    /api/sources/persian/stt"
echo "  GET    /api/sources/persian/llm"
echo ""
echo "Training:"
echo "  POST   /api/training"
echo "  GET    /api/training/:id"
echo "  GET    /api/training"
echo "  DELETE /api/training/:id"
echo ""
echo "Settings:"
echo "  GET    /api/settings"
echo "  POST   /api/settings"
echo "  PUT    /api/settings/huggingface/validate"
echo "  PUT    /api/settings/huggingface/token"
echo "  DELETE /api/settings/huggingface/token"
echo ""
echo "✅ Testing Complete!"
echo ""
echo "For full API documentation, see:"
echo "  - IMPLEMENTATION_REPORT.md"
echo "  - BACKEND/API_ENDPOINTS.md"
echo ""
