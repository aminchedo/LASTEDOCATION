#!/bin/bash

echo "🔍 PHASE 1: FILE STRUCTURE VERIFICATION"
echo "========================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0
SUCCESS=0

# Function to check file
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✅ $1${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ MISSING: $1${NC}"
        ((ERRORS++))
    fi
}

# Function to check directory
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✅ $1/${NC}"
        ((SUCCESS++))
    else
        echo -e "${RED}❌ MISSING DIR: $1/${NC}"
        ((ERRORS++))
    fi
}

echo ""
echo "📁 Checking Backend Structure..."
echo "--------------------------------"

# Backend Core
check_file "BACKEND/package.json"
check_file "BACKEND/tsconfig.json"
check_file "BACKEND/.env.example"
check_file "BACKEND/src/server.ts"
check_file "BACKEND/src/server-updated.ts"

# Backend Config
check_dir "BACKEND/src/config"
check_file "BACKEND/src/config/env.ts"
check_file "BACKEND/src/config/logger.ts"
check_file "BACKEND/src/config/sentry.ts"

# Backend Database
check_dir "BACKEND/src/database"
check_file "BACKEND/src/database/connection.ts"
check_file "BACKEND/src/database/schema.sql"

# Backend Routes
check_dir "BACKEND/src/routes"
check_file "BACKEND/src/routes/health.ts"
check_file "BACKEND/src/routes/monitoring.ts"

# Backend Services
check_dir "BACKEND/src/services"
check_file "BACKEND/src/services/huggingface.service.ts"

# Backend Middleware
check_dir "BACKEND/src/middleware"
check_file "BACKEND/src/middleware/error-handler.ts"
check_file "BACKEND/src/middleware/request-logger.ts"
check_file "BACKEND/src/middleware/analytics.ts"

# Backend Monitoring
check_dir "BACKEND/src/monitoring"
check_file "BACKEND/src/monitoring/health.ts"
check_file "BACKEND/src/monitoring/performance.ts"
check_file "BACKEND/src/monitoring/system.ts"
check_file "BACKEND/src/monitoring/analytics.ts"

# Backend Public
check_dir "BACKEND/public"
check_file "BACKEND/public/dashboard.html"

echo ""
echo "📁 Checking Frontend Structure..."
echo "--------------------------------"

# Frontend Core
check_file "client/package.json"
check_file "client/tsconfig.json"
check_file "client/vite.config.ts"
check_file "client/tailwind.config.js"
check_file "client/index.html"

# Frontend Source
check_file "client/src/App.tsx"
check_file "client/src/main.tsx"

# Frontend Pages
check_dir "client/src/pages"
check_file "client/src/pages/Home.tsx"
check_file "client/src/pages/Dashboard.tsx"

# Frontend Components
check_dir "client/src/components"
check_dir "client/src/components/dashboard"

# Frontend Hooks
check_dir "client/src/hooks"
check_file "client/src/hooks/useMonitoring.ts"

# Frontend Types
check_dir "client/src/types"
check_file "client/src/types/monitoring.types.ts"

# Frontend Utils
check_dir "client/src/utils"
check_file "client/src/utils/formatters.ts"

echo ""
echo "📁 Checking GitHub Actions..."
echo "--------------------------------"

check_dir ".github/workflows"
check_file ".github/workflows/ci.yml"
check_file ".github/workflows/ci-cd-pipeline.yml"
check_file ".github/workflows/docker-build.yml"
check_file ".github/workflows/ml-pipeline-ci.yml"
check_file ".github/workflows/voice-e2e-tests.yml"

echo ""
echo "📁 Checking Docker Configuration..."
echo "--------------------------------"

check_file "BACKEND/Dockerfile"
check_file "client/Dockerfile"
check_file "client/nginx.conf"
check_file "docker-compose.yml"
check_file "docker-compose.prod.yml"

echo ""
echo "📁 Checking Documentation..."
echo "--------------------------------"

check_file "README.md"
check_file ".env.example"
check_dir "docs"

echo ""
echo "========================================"
echo "📊 VERIFICATION SUMMARY"
echo "========================================"
echo -e "${GREEN}✅ Success: $SUCCESS${NC}"
echo -e "${YELLOW}⚠️  Warnings: $WARNINGS${NC}"
echo -e "${RED}❌ Errors: $ERRORS${NC}"

if [ $ERRORS -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL FILES VERIFIED SUCCESSFULLY!${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}❌ VERIFICATION FAILED - Missing files detected${NC}"
    exit 1
fi
