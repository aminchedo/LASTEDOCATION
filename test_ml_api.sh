#!/bin/bash
# ML API Integration Test Script

set -e

echo "════════════════════════════════════════════════════════"
echo "         ML PIPELINE API INTEGRATION TEST"
echo "════════════════════════════════════════════════════════"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

ML_URL="http://localhost:8000"
BACKEND_URL="http://localhost:3001"

# Test 1: ML Service Health
echo "1️⃣  Testing ML Service Health..."
HEALTH=$(curl -s ${ML_URL}/health)
if echo "$HEALTH" | grep -q "ok"; then
    echo -e "${GREEN}✓${NC} ML Service is healthy"
else
    echo -e "${RED}✗${NC} ML Service health check failed"
    exit 1
fi

# Test 2: Backend Proxy
echo "2️⃣  Testing Backend Proxy..."
MODELS=$(curl -s ${BACKEND_URL}/api/models/list)
echo -e "${GREEN}✓${NC} Backend proxy responding"

# Test 3: Train Model
echo "3️⃣  Testing Model Training..."
JOB_RESPONSE=$(curl -s -X POST ${ML_URL}/train -F "file=@test_data.csv")
JOB_ID=$(echo $JOB_RESPONSE | python3 -c "import sys,json; print(json.load(sys.stdin)['job_id'])" 2>/dev/null || echo "")

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}✗${NC} Training job creation failed"
    exit 1
fi

echo -e "${GREEN}✓${NC} Training job created: $JOB_ID"

# Test 4: Poll Status
echo "4️⃣  Polling Training Status..."
for i in {1..15}; do
    sleep 2
    STATUS=$(curl -s ${ML_URL}/train/status/$JOB_ID)
    STATE=$(echo $STATUS | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])" 2>/dev/null || echo "unknown")
    PROGRESS=$(echo $STATUS | python3 -c "import sys,json; print(json.load(sys.stdin)['progress'])" 2>/dev/null || echo "0")
    
    echo "   [$i] Status: $STATE ($PROGRESS%)"
    
    if [ "$STATE" = "completed" ]; then
        RMSE=$(echo $STATUS | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['metrics']['rmse_combined'])" 2>/dev/null || echo "N/A")
        echo -e "${GREEN}✓${NC} Training completed! RMSE: $RMSE"
        break
    elif [ "$STATE" = "failed" ]; then
        echo -e "${RED}✗${NC} Training failed"
        exit 1
    fi
done

# Test 5: Prediction
echo "5️⃣  Testing Prediction..."
PRED=$(curl -s -X POST ${ML_URL}/predict \
    -H "Content-Type: application/json" \
    -d '{"features":{"timestamp":"2025-10-12T12:00:00Z","feature_speed":1.2,"feature_bearing":270}}')

LAT=$(echo $PRED | python3 -c "import sys,json; print(json.load(sys.stdin)['predicted_latitude'])" 2>/dev/null || echo "")
LON=$(echo $PRED | python3 -c "import sys,json; print(json.load(sys.stdin)['predicted_longitude'])" 2>/dev/null || echo "")

if [ -n "$LAT" ] && [ -n "$LON" ]; then
    echo -e "${GREEN}✓${NC} Prediction successful: $LAT, $LON"
else
    echo -e "${RED}✗${NC} Prediction failed"
    exit 1
fi

# Test 6: List Models
echo "6️⃣  Testing Model Listing..."
MODEL_LIST=$(curl -s ${ML_URL}/models/list)
MODEL_COUNT=$(echo $MODEL_LIST | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null || echo "0")
echo -e "${GREEN}✓${NC} Found $MODEL_COUNT trained models"

echo ""
echo "════════════════════════════════════════════════════════"
echo -e "${GREEN}   ✅ ALL TESTS PASSED${NC}"
echo "════════════════════════════════════════════════════════"
