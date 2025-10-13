#!/bin/bash
#
# CI Status Checker
# Checks multiple job statuses and reports overall result
#
# Usage:
#   ./scripts/check-ci-status.sh <status1> <status2> <status3> ...
#
# Example:
#   ./scripts/check-ci-status.sh success success skipped success
#
# Exit codes:
#   0 - All jobs passed (success or skipped)
#   1 - One or more jobs failed
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Counter for failed jobs
FAILED_COUNT=0
PASSED_COUNT=0
SKIPPED_COUNT=0
TOTAL_COUNT=0

# Function to check if a status is acceptable
is_acceptable_status() {
    local status="$1"
    # Accept both "success" and "skipped" as passing statuses
    if [ "$status" = "success" ] || [ "$status" = "skipped" ]; then
        return 0
    else
        return 1
    fi
}

# Process each argument as a job status
for status in "$@"; do
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
    
    if [ "$status" = "success" ]; then
        PASSED_COUNT=$((PASSED_COUNT + 1))
        echo -e "${GREEN}✅${NC} Job $TOTAL_COUNT: $status"
    elif [ "$status" = "skipped" ]; then
        SKIPPED_COUNT=$((SKIPPED_COUNT + 1))
        echo -e "${YELLOW}⏭️${NC}  Job $TOTAL_COUNT: $status"
    else
        FAILED_COUNT=$((FAILED_COUNT + 1))
        echo -e "${RED}❌${NC} Job $TOTAL_COUNT: $status"
    fi
done

# Print summary
echo ""
echo "======================================"
echo "CI Status Summary"
echo "======================================"
echo "Total jobs:   $TOTAL_COUNT"
echo "Passed:       $PASSED_COUNT"
echo "Skipped:      $SKIPPED_COUNT"
echo "Failed:       $FAILED_COUNT"
echo "======================================"

# Determine overall result
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}✅ CI Passed Successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ CI Failed${NC}"
    echo "Error: $FAILED_COUNT job(s) failed"
    exit 1
fi
