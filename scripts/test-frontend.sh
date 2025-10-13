#!/bin/bash

echo "🔍 PHASE 3: FRONTEND FUNCTIONALITY VERIFICATION"
echo "=============================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

cd client

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# TypeScript Compilation
echo "Testing TypeScript compilation..."
if npx tsc --noEmit; then
    echo -e "${GREEN}✅ TypeScript compilation successful${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    exit 1
fi

# Linting
echo "Running ESLint..."
if npm run lint 2>/dev/null; then
    echo -e "${GREEN}✅ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting warnings detected (or no lint script)${NC}"
fi

# Build Test
echo "Testing production build..."
if npm run build; then
    echo -e "${GREEN}✅ Production build successful${NC}"
    
    # Check build size
    BUILD_SIZE=$(du -sh dist 2>/dev/null | cut -f1)
    echo "📦 Build size: $BUILD_SIZE"
else
    echo -e "${RED}❌ Production build failed${NC}"
    exit 1
fi

# Check if dev server is running
if curl -s http://localhost:5173 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend dev server is running${NC}"
    
    # Test Dashboard route
    DASHBOARD=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5173/dashboard)
    if [ "$DASHBOARD" = "200" ]; then
        echo -e "${GREEN}✅ Dashboard route accessible${NC}"
    else
        echo -e "${YELLOW}⚠️  Dashboard route returned: $DASHBOARD${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Frontend dev server not running (start with: npm run dev)${NC}"
fi

echo ""
echo -e "${GREEN}🎉 FRONTEND VERIFICATION COMPLETE!${NC}"
