#!/bin/bash

echo "╔════════════════════════════════════════════════════════╗"
echo "║  PERSIAN TTS/AI PLATFORM - MASTER VERIFICATION        ║"
echo "║  Complete Functionality Check                          ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PHASE_PASSED=0
PHASE_FAILED=0

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

run_phase() {
    local script=$1
    local phase_name=$2
    
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$phase_name${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════════════════${NC}"
    echo ""
    
    if [ -f "$SCRIPT_DIR/$script" ]; then
        chmod +x "$SCRIPT_DIR/$script"
        if bash "$SCRIPT_DIR/$script"; then
            echo -e "${GREEN}✅ $phase_name PASSED${NC}"
            ((PHASE_PASSED++))
            return 0
        else
            echo -e "${RED}❌ $phase_name FAILED${NC}"
            ((PHASE_FAILED++))
            return 1
        fi
    else
        echo -e "${RED}❌ Script not found: $script${NC}"
        ((PHASE_FAILED++))
        return 1
    fi
}

# Change to project root (parent of scripts directory)
cd "$SCRIPT_DIR/.."

# Run all phases
run_phase "verify-structure.sh" "PHASE 1: File Structure Verification"
run_phase "test-backend.sh" "PHASE 2: Backend Functionality"
run_phase "test-frontend.sh" "PHASE 3: Frontend Functionality"
run_phase "test-database.sh" "PHASE 4: Database Verification"
run_phase "test-docker.sh" "PHASE 5: Docker Verification"
run_phase "test-workflows.sh" "PHASE 6: GitHub Actions Verification"
run_phase "test-integration.sh" "PHASE 7: Integration Tests"

# Final Summary
echo ""
echo "╔════════════════════════════════════════════════════════╗"
echo "║              MASTER VERIFICATION SUMMARY               ║"
echo "╚════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}✅ Phases Passed: $PHASE_PASSED${NC}"
echo -e "${RED}❌ Phases Failed: $PHASE_FAILED${NC}"
echo ""

if [ $PHASE_FAILED -eq 0 ]; then
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║  🎉  ALL VERIFICATION PHASES PASSED SUCCESSFULLY!  🎉  ║"
    echo "║                                                        ║"
    echo "║  Your Persian TTS/AI Platform is FULLY FUNCTIONAL!    ║"
    echo "║  Ready for production deployment! 🚀                   ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    exit 0
else
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║                                                        ║"
    echo "║  ⚠️   VERIFICATION INCOMPLETE - ISSUES DETECTED  ⚠️    ║"
    echo "║                                                        ║"
    echo "║  Please review failed phases and fix issues.           ║"
    echo "║                                                        ║"
    echo "╚════════════════════════════════════════════════════════╝"
    exit 1
fi
