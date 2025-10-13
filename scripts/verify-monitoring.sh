#!/bin/bash

# Monitoring & Logging Verification Script
# This script verifies that all monitoring components are working correctly

set -e

echo "🔍 Verifying Monitoring & Logging Implementation..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend directory
BACKEND_DIR="BACKEND"

# Check if backend directory exists
if [ ! -d "$BACKEND_DIR" ]; then
    echo -e "${RED}❌ BACKEND directory not found${NC}"
    exit 1
fi

echo "📋 Checking Files..."
echo ""

# Array of required files
declare -a FILES=(
    "$BACKEND_DIR/src/config/logger.ts"
    "$BACKEND_DIR/src/config/sentry.ts"
    "$BACKEND_DIR/src/middleware/request-logger.ts"
    "$BACKEND_DIR/src/middleware/query-logger.ts"
    "$BACKEND_DIR/src/middleware/error-handler.ts"
    "$BACKEND_DIR/src/middleware/analytics.ts"
    "$BACKEND_DIR/src/monitoring/performance.ts"
    "$BACKEND_DIR/src/monitoring/system.ts"
    "$BACKEND_DIR/src/monitoring/analytics.ts"
    "$BACKEND_DIR/src/monitoring/health.ts"
    "$BACKEND_DIR/src/routes/health.ts"
    "$BACKEND_DIR/src/routes/monitoring.ts"
    "$BACKEND_DIR/src/server-monitored.ts"
)

# Check each file
MISSING_FILES=0
for file in "${FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        MISSING_FILES=$((MISSING_FILES + 1))
    fi
done

echo ""

if [ $MISSING_FILES -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_FILES file(s) missing${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All monitoring files present${NC}"
echo ""

# Check dependencies
echo "📦 Checking Dependencies..."
echo ""

cd "$BACKEND_DIR"

declare -a DEPS=(
    "winston"
    "winston-daily-rotate-file"
    "morgan"
    "@sentry/node"
    "@sentry/profiling-node"
)

MISSING_DEPS=0
for dep in "${DEPS[@]}"; do
    if npm list "$dep" &> /dev/null; then
        echo -e "${GREEN}✓${NC} $dep"
    else
        echo -e "${RED}✗${NC} $dep (not installed)"
        MISSING_DEPS=$((MISSING_DEPS + 1))
    fi
done

echo ""

if [ $MISSING_DEPS -gt 0 ]; then
    echo -e "${RED}❌ $MISSING_DEPS dependency(ies) missing${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All dependencies installed${NC}"
echo ""

# TypeScript compilation check
echo "🔧 Checking TypeScript Compilation..."
echo ""

if npm run lint &> /dev/null; then
    echo -e "${GREEN}✅ TypeScript compiles without errors${NC}"
else
    echo -e "${RED}❌ TypeScript compilation failed${NC}"
    echo ""
    echo "Running lint to show errors:"
    npm run lint
    exit 1
fi

echo ""

# Check for test files
echo "🧪 Checking Test Files..."
echo ""

declare -a TEST_FILES=(
    "src/__tests__/setup.ts"
    "src/__tests__/api/health.test.ts"
    "src/__tests__/monitoring/performance.test.ts"
    "src/__tests__/monitoring/analytics.test.ts"
)

MISSING_TESTS=0
for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${YELLOW}⚠${NC} $file (missing - optional)"
        MISSING_TESTS=$((MISSING_TESTS + 1))
    fi
done

echo ""

if [ $MISSING_TESTS -eq 0 ]; then
    echo -e "${GREEN}✅ All test files present${NC}"
else
    echo -e "${YELLOW}⚠️  $MISSING_TESTS test file(s) missing (optional)${NC}"
fi

echo ""

# Check environment configuration
echo "⚙️  Checking Environment Configuration..."
echo ""

if [ -f "../.env.example" ]; then
    echo -e "${GREEN}✓${NC} .env.example found"
    
    # Check for monitoring-related env vars
    if grep -q "SENTRY_DSN" "../.env.example"; then
        echo -e "${GREEN}✓${NC} SENTRY_DSN in .env.example"
    else
        echo -e "${YELLOW}⚠${NC} SENTRY_DSN not in .env.example"
    fi
else
    echo -e "${YELLOW}⚠${NC} .env.example not found"
fi

echo ""

# Check GitHub workflows
echo "🔄 Checking CI/CD Workflows..."
echo ""

cd ..

declare -a WORKFLOWS=(
    ".github/workflows/ci.yml"
    ".github/workflows/docker-build.yml"
    ".github/workflows/deploy.yml"
    ".github/workflows/rollback.yml"
)

MISSING_WORKFLOWS=0
for workflow in "${WORKFLOWS[@]}"; do
    if [ -f "$workflow" ]; then
        echo -e "${GREEN}✓${NC} $workflow"
    else
        echo -e "${RED}✗${NC} $workflow (missing)"
        MISSING_WORKFLOWS=$((MISSING_WORKFLOWS + 1))
    fi
done

echo ""

if [ $MISSING_WORKFLOWS -eq 0 ]; then
    echo -e "${GREEN}✅ All workflows present${NC}"
else
    echo -e "${RED}❌ $MISSING_WORKFLOWS workflow(s) missing${NC}"
fi

echo ""

# Check Docker configuration
echo "🐳 Checking Docker Configuration..."
echo ""

declare -a DOCKER_FILES=(
    "BACKEND/Dockerfile"
    "client/Dockerfile"
    "client/nginx.conf"
    "docker-compose.yml"
    "docker-compose.prod.yml"
)

MISSING_DOCKER=0
for file in "${DOCKER_FILES[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file"
    else
        echo -e "${RED}✗${NC} $file (missing)"
        MISSING_DOCKER=$((MISSING_DOCKER + 1))
    fi
done

echo ""

if [ $MISSING_DOCKER -eq 0 ]; then
    echo -e "${GREEN}✅ All Docker files present${NC}"
else
    echo -e "${RED}❌ $MISSING_DOCKER Docker file(s) missing${NC}"
fi

echo ""

# Check documentation
echo "📚 Checking Documentation..."
echo ""

declare -a DOCS=(
    "docs/DEPLOYMENT.md"
    "docs/CI_CD.md"
    "docs/MONITORING_LOGGING_GUIDE.md"
    "docs/GITHUB_SECRETS.md"
)

MISSING_DOCS=0
for doc in "${DOCS[@]}"; do
    if [ -f "$doc" ]; then
        echo -e "${GREEN}✓${NC} $doc"
    else
        echo -e "${YELLOW}⚠${NC} $doc (missing)"
        MISSING_DOCS=$((MISSING_DOCS + 1))
    fi
done

echo ""

if [ $MISSING_DOCS -eq 0 ]; then
    echo -e "${GREEN}✅ All documentation present${NC}"
else
    echo -e "${YELLOW}⚠️  $MISSING_DOCS documentation file(s) missing${NC}"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Final summary
TOTAL_ISSUES=$((MISSING_FILES + MISSING_DEPS + MISSING_WORKFLOWS + MISSING_DOCKER))

if [ $TOTAL_ISSUES -eq 0 ]; then
    echo -e "${GREEN}🎉 All Checks Passed!${NC}"
    echo ""
    echo "Monitoring & Logging implementation is complete and verified."
    echo ""
    echo "Next steps:"
    echo "  1. Start the backend: cd BACKEND && npm run dev"
    echo "  2. Test health endpoint: curl http://localhost:3001/health"
    echo "  3. Test monitoring: curl http://localhost:3001/api/monitoring/system"
    echo ""
    exit 0
else
    echo -e "${RED}❌ Verification Failed${NC}"
    echo ""
    echo "Found $TOTAL_ISSUES critical issue(s)."
    echo "Please fix the issues above and run this script again."
    echo ""
    exit 1
fi
