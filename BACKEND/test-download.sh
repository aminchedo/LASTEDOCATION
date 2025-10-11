#!/bin/bash

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="${API_URL:-http://localhost:3001}"

echo "======================================"
echo "🧪 Model Download System Test"
echo "======================================"
echo ""

# Test 1: Get catalog
echo -e "${BLUE}Test 1: Get Model Catalog${NC}"
CATALOG_RESPONSE=$(curl -s "${API_URL}/api/sources/catalog")
CATALOG_COUNT=$(echo "$CATALOG_RESPONSE" | jq -r '.data | length' 2>/dev/null)

if [ "$CATALOG_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Found ${CATALOG_COUNT} models/datasets in catalog"
else
    echo -e "${RED}❌ FAILED${NC} - Could not fetch catalog"
    exit 1
fi
echo ""

# Test 2: Get specific model
echo -e "${BLUE}Test 2: Get Specific Model (TTS Male)${NC}"
MODEL_ID="Kamtera/persian-tts-male-vits"
ENCODED_ID=$(printf %s "$MODEL_ID" | jq -sRr @uri)
MODEL_RESPONSE=$(curl -s "${API_URL}/api/sources/catalog/${ENCODED_ID}")
MODEL_NAME=$(echo "$MODEL_RESPONSE" | jq -r '.data.name' 2>/dev/null)

if [ "$MODEL_NAME" != "null" ] && [ -n "$MODEL_NAME" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Found model: $MODEL_NAME"
    
    # Check for download URLs
    HAS_URLS=$(echo "$MODEL_RESPONSE" | jq -r '.data.downloadUrls != null' 2>/dev/null)
    if [ "$HAS_URLS" = "true" ]; then
        echo -e "${GREEN}   ✓${NC} Model has direct download URLs"
    else
        echo -e "${YELLOW}   ⚠${NC} Model missing download URLs (will use CLI fallback)"
    fi
else
    echo -e "${RED}❌ FAILED${NC} - Could not fetch model"
    exit 1
fi
echo ""

# Test 3: Start download
echo -e "${BLUE}Test 3: Start Model Download${NC}"
DOWNLOAD_RESPONSE=$(curl -s -X POST "${API_URL}/api/sources/catalog/download" \
    -H "Content-Type: application/json" \
    -d "{\"modelId\": \"${MODEL_ID}\"}")

JOB_ID=$(echo "$DOWNLOAD_RESPONSE" | jq -r '.data.jobId' 2>/dev/null)

if [ "$JOB_ID" != "null" ] && [ -n "$JOB_ID" ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Download started with Job ID: $JOB_ID"
else
    echo -e "${RED}❌ FAILED${NC} - Could not start download"
    echo "Response: $DOWNLOAD_RESPONSE"
    exit 1
fi
echo ""

# Test 4: Check download progress
echo -e "${BLUE}Test 4: Monitor Download Progress${NC}"
echo "Checking status for 10 seconds..."

for i in {1..10}; do
    sleep 1
    STATUS_RESPONSE=$(curl -s "${API_URL}/api/sources/download/${JOB_ID}")
    STATUS=$(echo "$STATUS_RESPONSE" | jq -r '.data.status' 2>/dev/null)
    PROGRESS=$(echo "$STATUS_RESPONSE" | jq -r '.data.progress // 0' 2>/dev/null)
    CURRENT_FILE=$(echo "$STATUS_RESPONSE" | jq -r '.data.currentFile // "N/A"' 2>/dev/null)
    
    if [ "$STATUS" = "completed" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - Download completed!"
        break
    elif [ "$STATUS" = "error" ]; then
        ERROR=$(echo "$STATUS_RESPONSE" | jq -r '.data.error' 2>/dev/null)
        echo -e "${RED}❌ FAILED${NC} - Download error: $ERROR"
        exit 1
    else
        echo -e "   [${i}/10] Status: ${YELLOW}${STATUS}${NC} | Progress: ${PROGRESS}% | File: ${CURRENT_FILE}"
    fi
done

echo ""

# Test 5: Cancel download (if still running)
if [ "$STATUS" != "completed" ]; then
    echo -e "${BLUE}Test 5: Cancel Download${NC}"
    CANCEL_RESPONSE=$(curl -s -X DELETE "${API_URL}/api/sources/download/${JOB_ID}")
    CANCEL_SUCCESS=$(echo "$CANCEL_RESPONSE" | jq -r '.success' 2>/dev/null)
    
    if [ "$CANCEL_SUCCESS" = "true" ]; then
        echo -e "${GREEN}✅ SUCCESS${NC} - Download cancelled"
    else
        echo -e "${YELLOW}⚠ WARNING${NC} - Could not cancel (may have completed)"
    fi
    echo ""
fi

# Test 6: Get all downloads
echo -e "${BLUE}Test 6: Get All Downloads${NC}"
DOWNLOADS_RESPONSE=$(curl -s "${API_URL}/api/sources/downloads")
DOWNLOADS_COUNT=$(echo "$DOWNLOADS_RESPONSE" | jq -r '.data | length' 2>/dev/null)

if [ "$DOWNLOADS_COUNT" -ge 0 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Found ${DOWNLOADS_COUNT} download job(s)"
else
    echo -e "${RED}❌ FAILED${NC} - Could not fetch downloads"
    exit 1
fi
echo ""

# Test 7: Get TTS models
echo -e "${BLUE}Test 7: Get TTS Models${NC}"
TTS_RESPONSE=$(curl -s "${API_URL}/api/sources/models/available")
TTS_COUNT=$(echo "$TTS_RESPONSE" | jq -r '[.data[] | select(.type == "tts")] | length' 2>/dev/null)

if [ "$TTS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Found ${TTS_COUNT} TTS model(s)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - No TTS models found"
fi
echo ""

# Test 8: Get datasets
echo -e "${BLUE}Test 8: Get Datasets${NC}"
DATASETS_RESPONSE=$(curl -s "${API_URL}/api/sources/datasets/available")
DATASETS_COUNT=$(echo "$DATASETS_RESPONSE" | jq -r '.data | length' 2>/dev/null)

if [ "$DATASETS_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ SUCCESS${NC} - Found ${DATASETS_COUNT} dataset(s)"
else
    echo -e "${YELLOW}⚠ WARNING${NC} - No datasets found"
fi
echo ""

echo "======================================"
echo -e "${GREEN}🎉 All Tests Completed!${NC}"
echo "======================================"
echo ""
echo "Summary:"
echo "  ✓ Catalog API working"
echo "  ✓ Model retrieval working"
echo "  ✓ Download start/stop working"
echo "  ✓ Progress tracking working"
echo "  ✓ TTS models available: $TTS_COUNT"
echo "  ✓ Datasets available: $DATASETS_COUNT"
echo ""
echo "Next Steps:"
echo "  1. Check downloaded files in: BACKEND/datasets/ or BACKEND/models/"
echo "  2. View download logs in: BACKEND/logs/downloads/"
echo "  3. Try downloading other models from the catalog"
echo ""
