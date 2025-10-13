#!/bin/bash

echo "🔍 PHASE 6: GITHUB ACTIONS VERIFICATION"
echo "========================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check if GitHub CLI is installed
if command -v gh &> /dev/null; then
    echo -e "${GREEN}✅ GitHub CLI is installed${NC}"
    
    # List workflows
    echo ""
    echo "Workflows in repository:"
    gh workflow list 2>/dev/null || echo -e "${YELLOW}⚠️  Could not list workflows (may not be authenticated)${NC}"
    
    echo ""
    echo "Recent workflow runs:"
    gh run list --limit 5 2>/dev/null || echo -e "${YELLOW}⚠️  Could not list workflow runs (may not be authenticated)${NC}"
else
    echo -e "${YELLOW}⚠️  GitHub CLI not installed - skipping online checks${NC}"
fi

# Check workflow files
echo ""
echo "Checking workflow files..."
WORKFLOW_DIR=".github/workflows"

if [ -d "$WORKFLOW_DIR" ]; then
    WORKFLOW_COUNT=$(ls -1 "$WORKFLOW_DIR"/*.yml 2>/dev/null | wc -l)
    echo -e "${GREEN}✅ Found $WORKFLOW_COUNT workflow files${NC}"
    
    for file in "$WORKFLOW_DIR"/*.yml "$WORKFLOW_DIR"/*.yaml; do
        if [ -f "$file" ]; then
            filename=$(basename "$file")
            echo -e "  ${GREEN}✅ $filename${NC}"
        fi
    done
else
    echo -e "${RED}❌ Workflows directory not found${NC}"
fi

echo ""
echo -e "${GREEN}🎉 GITHUB ACTIONS VERIFICATION COMPLETE!${NC}"
