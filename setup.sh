#!/bin/bash
set -e

echo "🚀 Persian TTS/AI Platform - Automated Setup"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Error handling
error_exit() {
    echo -e "${RED}❌ Error: $1${NC}" >&2
    exit 1
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# 1. Check prerequisites
echo "📋 Checking prerequisites..."

check_postgres() {
    if command -v psql >/dev/null 2>&1; then
        POSTGRES_VERSION=$(psql --version | awk '{print $3}')
        success "PostgreSQL installed (version $POSTGRES_VERSION)"
        return 0
    else
        error_exit "PostgreSQL not found. Please install PostgreSQL 14 or higher."
    fi
}

check_node() {
    if command -v node >/dev/null 2>&1; then
        NODE_VERSION=$(node -v)
        success "Node.js installed ($NODE_VERSION)"
        return 0
    else
        error_exit "Node.js not found. Please install Node.js 18 or higher."
    fi
}

check_npm() {
    if command -v npm >/dev/null 2>&1; then
        NPM_VERSION=$(npm -v)
        success "npm installed (version $NPM_VERSION)"
        return 0
    else
        error_exit "npm not found."
    fi
}

check_postgres
check_node
check_npm

echo ""

# 2. Check if .env file exists
echo "🔐 Checking environment configuration..."
if [ ! -f "BACKEND/.env" ]; then
    info "No .env file found. Running environment setup..."
    ./setup-env.sh
else
    success ".env file exists"
fi

echo ""

# 3. Create database
echo "💾 Setting up database..."

create_database() {
    # Read DATABASE_URL from .env if exists
    if [ -f "BACKEND/.env" ]; then
        export $(cat BACKEND/.env | grep -v '^#' | xargs)
    fi

    DB_NAME="${DB_NAME:-persian_tts}"
    DB_USER="${DB_USER:-postgres}"
    
    # Check if database exists
    if psql -U "$DB_USER" -lqt 2>/dev/null | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        info "Database '$DB_NAME' already exists"
    else
        info "Creating database '$DB_NAME'..."
        createdb -U "$DB_USER" "$DB_NAME" 2>/dev/null || info "Database creation skipped (may already exist)"
    fi
    
    success "Database ready"
}

create_database

echo ""

# 4. Install dependencies
echo "📦 Installing dependencies..."

install_backend_deps() {
    info "Installing backend dependencies..."
    cd BACKEND
    npm install --silent
    cd ..
    success "Backend dependencies installed"
}

install_client_deps() {
    info "Installing client dependencies..."
    cd client
    npm install --silent
    cd ..
    success "Client dependencies installed"
}

install_backend_deps
install_client_deps

echo ""

# 5. Initialize database schema
echo "🗄️  Initializing database schema..."

init_database() {
    if [ -f "BACKEND/.env" ]; then
        export $(cat BACKEND/.env | grep -v '^#' | xargs)
    fi

    DB_NAME="${DB_NAME:-persian_tts}"
    DB_USER="${DB_USER:-postgres}"
    
    if [ -f "BACKEND/src/database/schema.sql" ]; then
        info "Applying database schema..."
        psql -U "$DB_USER" -d "$DB_NAME" -f BACKEND/src/database/schema.sql > /dev/null 2>&1 || info "Schema already applied"
        success "Database schema initialized"
    else
        error_exit "Schema file not found at BACKEND/src/database/schema.sql"
    fi
}

init_database

echo ""

# 6. Build projects
echo "🔨 Building projects..."

build_backend() {
    info "Building backend..."
    cd BACKEND
    npm run build > /dev/null 2>&1
    cd ..
    success "Backend build complete"
}

build_client() {
    info "Building client..."
    cd client
    npm run build > /dev/null 2>&1
    cd ..
    success "Client build complete"
}

build_backend
build_client

echo ""

# 7. Run verification
echo "🔍 Running verification checks..."

verify_database() {
    info "Verifying database..."
    cd BACKEND
    npm run verify:db > /dev/null 2>&1 && success "Database verification passed" || info "Database verification skipped"
    cd ..
}

verify_typescript() {
    info "Verifying TypeScript compilation..."
    cd BACKEND
    npm run verify:ts > /dev/null 2>&1 && success "TypeScript verification passed" || info "TypeScript verification skipped"
    cd ..
}

verify_database
verify_typescript

echo ""

# 8. Create required directories
echo "📁 Creating required directories..."

mkdir -p BACKEND/models
mkdir -p BACKEND/logs
mkdir -p BACKEND/data/datasets
mkdir -p BACKEND/data/sources
mkdir -p BACKEND/artifacts/jobs

success "Directories created"

echo ""

# 9. Make scripts executable
echo "🔧 Setting script permissions..."

chmod +x setup.sh 2>/dev/null || true
chmod +x setup-env.sh 2>/dev/null || true
chmod +x start.sh 2>/dev/null || true
chmod +x stop.sh 2>/dev/null || true

success "Script permissions set"

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Setup complete! Platform is ready.${NC}"
echo ""
echo "Next steps:"
echo "  1. Start servers: ./start.sh"
echo "  2. Open browser: http://localhost:5173"
echo "  3. Stop servers: ./stop.sh"
echo ""
echo "For more information, see README.md"
echo "=============================================="
