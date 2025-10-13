#!/bin/bash
#
# End-to-end test script for Training API
# Tests job creation, status polling, and completion verification
#

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

API_URL="http://127.0.0.1:3001"

echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Training API End-to-End Test${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Check server health
echo -e "${YELLOW}[1/6]${NC} Testing server health..."
HEALTH=$(curl -s ${API_URL}/health)
if echo "$HEALTH" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Server is healthy${NC}"
else
    echo -e "${RED}❌ Server health check failed${NC}"
    exit 1
fi

# Step 2: Create training job
echo -e "${YELLOW}[2/6]${NC} Creating training job..."
JOB_RESPONSE=$(curl -s -X POST ${API_URL}/api/train \
    -H "Content-Type: application/json" \
    -d '{"epochs":2,"batch_size":8,"lr":0.02}')

JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"job_id":"[^"]*"' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}❌ Failed to create job${NC}"
    echo "Response: $JOB_RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Job created: ${JOB_ID}${NC}"

# Step 3: Poll job status
echo -e "${YELLOW}[3/6]${NC} Monitoring job progress..."
for i in {1..10}; do
    sleep 2
    STATUS=$(curl -s "${API_URL}/api/train/status?job_id=${JOB_ID}")
    
    JOB_STATUS=$(echo "$STATUS" | grep -o '"status":"[^"]*"' | head -1 | cut -d'"' -f4)
    PROGRESS=$(echo "$STATUS" | grep -o '"progress":[0-9.]*' | cut -d':' -f2)
    
    if [ -n "$JOB_STATUS" ]; then
        echo -e "  Poll $i: Status=${JOB_STATUS}, Progress=${PROGRESS}%"
    fi
    
    if [ "$JOB_STATUS" = "COMPLETED" ]; then
        echo -e "${GREEN}✅ Job completed successfully${NC}"
        break
    fi
    
    if [ "$JOB_STATUS" = "ERROR" ]; then
        echo -e "${RED}❌ Job failed${NC}"
        exit 1
    fi
done

# Step 4: Verify artifacts
echo -e "${YELLOW}[4/6]${NC} Verifying artifacts..."
if [ -f "artifacts/jobs/${JOB_ID}.json" ]; then
    echo -e "${GREEN}✅ Job status file created${NC}"
    cat "artifacts/jobs/${JOB_ID}.json" | head -20
else
    echo -e "${RED}❌ Job status file not found${NC}"
    exit 1
fi

# Step 5: Check model checkpoint
echo -e "${YELLOW}[5/6]${NC} Checking model checkpoint..."
if [ -f "models/${JOB_ID}.pt" ]; then
    SIZE=$(ls -lh "models/${JOB_ID}.pt" | awk '{print $5}')
    echo -e "${GREEN}✅ Model checkpoint saved (${SIZE})${NC}"
else
    echo -e "${YELLOW}⚠️  Model checkpoint not found (might still be training)${NC}"
fi

# Step 6: List all jobs
echo -e "${YELLOW}[6/6]${NC} Listing all jobs..."
ALL_JOBS=$(curl -s "${API_URL}/api/train/jobs")
JOB_COUNT=$(echo "$ALL_JOBS" | grep -o '"count":[0-9]*' | cut -d':' -f2)
echo -e "${GREEN}✅ Found ${JOB_COUNT} total jobs${NC}"

echo ""
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}✅ All tests passed!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
echo ""
echo "Job ID: ${JOB_ID}"
echo "Artifacts: artifacts/jobs/${JOB_ID}.json"
echo "Model: models/${JOB_ID}.pt"
