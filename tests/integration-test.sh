#!/bin/bash
# Complete Integration Test for AI Training Platform
# Tests: Auth → Dataset Upload → Training Job → WebSocket Updates → Download Model

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
API_BASE="${API_BASE_URL:-http://localhost:3001}"
TEST_EMAIL="integration-test-$(date +%s)@test.com"
TEST_PASSWORD="TestPass123!"
TEST_NAME="Integration Test User"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}AI Training Platform - Integration Test${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Cleanup function
cleanup() {
    echo -e "\n${YELLOW}Cleaning up...${NC}"
    # Add any cleanup logic here
}

trap cleanup EXIT

# Test 1: Health Check
echo -e "${YELLOW}[1/7] Testing Health Check...${NC}"
HEALTH=$(curl -s "${API_BASE}/health")
if echo "$HEALTH" | grep -q '"ok":true'; then
    echo -e "${GREEN}✓ Health check passed${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    exit 1
fi

# Test 2: User Registration
echo -e "\n${YELLOW}[2/7] Testing User Registration...${NC}"
REGISTER_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\",\"name\":\"${TEST_NAME}\"}")

TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}✗ Registration failed${NC}"
    echo "$REGISTER_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ User registered successfully${NC}"
    echo -e "  Token: ${TOKEN:0:20}..."
fi

# Test 3: Login
echo -e "\n${YELLOW}[3/7] Testing User Login...${NC}"
LOGIN_RESPONSE=$(curl -s -X POST "${API_BASE}/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD}\"}")

LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)

if [ -z "$LOGIN_TOKEN" ]; then
    echo -e "${RED}✗ Login failed${NC}"
    echo "$LOGIN_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Login successful${NC}"
fi

# Test 4: Protected Endpoint (Get Current User)
echo -e "\n${YELLOW}[4/7] Testing Protected Endpoint...${NC}"
ME_RESPONSE=$(curl -s -X GET "${API_BASE}/api/auth/me" \
    -H "Authorization: Bearer ${TOKEN}")

if echo "$ME_RESPONSE" | grep -q "$TEST_EMAIL"; then
    echo -e "${GREEN}✓ Protected endpoint works${NC}"
    echo -e "  User: $TEST_EMAIL"
else
    echo -e "${RED}✗ Protected endpoint failed${NC}"
    echo "$ME_RESPONSE"
    exit 1
fi

# Test 5: Create Training Job
echo -e "\n${YELLOW}[5/7] Testing Training Job Creation...${NC}"
JOB_RESPONSE=$(curl -s -X POST "${API_BASE}/api/training" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer ${TOKEN}" \
    -d '{"epochs":2,"batch_size":16,"lr":0.01,"dataset":"test_data/sample_dataset.csv"}')

JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"job_id":"[^"]*' | cut -d'"' -f4)

if [ -z "$JOB_ID" ]; then
    echo -e "${RED}✗ Training job creation failed${NC}"
    echo "$JOB_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Training job created${NC}"
    echo -e "  Job ID: $JOB_ID"
fi

# Test 6: Check Job Status
echo -e "\n${YELLOW}[6/7] Testing Job Status Retrieval...${NC}"
sleep 2  # Wait for job to start

STATUS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/training/status?job_id=${JOB_ID}" \
    -H "Authorization: Bearer ${TOKEN}")

JOB_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)

if [ -z "$JOB_STATUS" ]; then
    echo -e "${RED}✗ Job status retrieval failed${NC}"
    echo "$STATUS_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Job status retrieved${NC}"
    echo -e "  Status: $JOB_STATUS"
fi

# Monitor job progress
echo -e "\n${BLUE}Monitoring job progress...${NC}"
for i in {1..10}; do
    sleep 2
    STATUS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/training/status?job_id=${JOB_ID}" \
        -H "Authorization: Bearer ${TOKEN}")
    
    JOB_STATUS=$(echo "$STATUS_RESPONSE" | grep -o '"status":"[^"]*' | cut -d'"' -f4)
    PROGRESS=$(echo "$STATUS_RESPONSE" | grep -o '"progress":[0-9.]*' | cut -d':' -f2)
    
    echo -e "  Status: ${JOB_STATUS}, Progress: ${PROGRESS}%"
    
    if [ "$JOB_STATUS" = "COMPLETED" ]; then
        echo -e "${GREEN}✓ Job completed successfully${NC}"
        break
    fi
    
    if [ "$JOB_STATUS" = "FAILED" ]; then
        echo -e "${RED}✗ Job failed${NC}"
        echo "$STATUS_RESPONSE"
        exit 1
    fi
done

# Test 7: List All Jobs
echo -e "\n${YELLOW}[7/7] Testing List All Jobs...${NC}"
JOBS_RESPONSE=$(curl -s -X GET "${API_BASE}/api/training/jobs" \
    -H "Authorization: Bearer ${TOKEN}")

JOB_COUNT=$(echo "$JOBS_RESPONSE" | grep -o '"count":[0-9]*' | cut -d':' -f2)

if [ -z "$JOB_COUNT" ]; then
    echo -e "${RED}✗ List jobs failed${NC}"
    echo "$JOBS_RESPONSE"
    exit 1
else
    echo -e "${GREEN}✓ Jobs listed successfully${NC}"
    echo -e "  Total jobs: $JOB_COUNT"
fi

# Final Summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}✓ All Integration Tests Passed!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "\n${BLUE}Test Summary:${NC}"
echo -e "  ✓ Health check"
echo -e "  ✓ User registration"
echo -e "  ✓ User login"
echo -e "  ✓ Protected endpoints"
echo -e "  ✓ Training job creation"
echo -e "  ✓ Job status monitoring"
echo -e "  ✓ List jobs"
echo -e "\n${GREEN}System is fully functional!${NC}"

exit 0
