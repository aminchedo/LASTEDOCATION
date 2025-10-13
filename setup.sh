#!/bin/bash

# Persian TTS/AI Platform - Automated Setup Script
# This script sets up the complete environment for development

set -e  # Exit on error

echo "🚀 Persian TTS/AI Platform - Setup Script"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check prerequisites
echo "1️⃣  Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node --version)"
    exit 1
fi
print_success "Node.js $(node --version) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm --version) found"

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    print_error "PostgreSQL is not installed. Please install PostgreSQL 12+ first."
    echo "  Ubuntu/Debian: sudo apt-get install postgresql postgresql-contrib"
    echo "  macOS: brew install postgresql@14"
    exit 1
fi
print_success "PostgreSQL found"

echo ""
echo "2️⃣  Setting up database..."

# Get database credentials
read -p "Database name (default: persian_tts): " DB_NAME
DB_NAME=${DB_NAME:-persian_tts}

read -p "Database user (default: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database password: " DB_PASSWORD
echo ""

read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Test database connection
print_info "Testing database connection..."
export PGPASSWORD=$DB_PASSWORD
if psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "SELECT 1" &> /dev/null; then
    print_success "Database connection successful"
else
    print_error "Cannot connect to database. Please check credentials."
    exit 1
fi

# Create database if it doesn't exist
print_info "Creating database '$DB_NAME' if it doesn't exist..."
psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d postgres -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true
print_success "Database ready"

# Build DATABASE_URL
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

echo ""
echo "3️⃣  Configuring environment..."

# Create .env file for backend
cd BACKEND

if [ -f .env ]; then
    print_info "Backing up existing .env to .env.backup"
    cp .env .env.backup
fi

cat > .env << EOF
# Database Configuration
DATABASE_URL=$DATABASE_URL
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# Server Configuration
NODE_ENV=development
PORT=3001

# Security
JWT_SECRET=$(openssl rand -base64 32)

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# HuggingFace (optional - add your token)
HF_TOKEN=

# Logging
LOG_DIR=logs
EOF

print_success "Backend .env file created"

cd ..

echo ""
echo "4️⃣  Installing dependencies..."

# Backend dependencies
print_info "Installing backend dependencies..."
cd BACKEND
npm install --silent
print_success "Backend dependencies installed"

cd ..

# Frontend dependencies
print_info "Installing frontend dependencies..."
cd client
npm install --silent
print_success "Frontend dependencies installed"

cd ..

echo ""
echo "5️⃣  Building projects..."

# Build backend
print_info "Building backend..."
cd BACKEND
npm run build
print_success "Backend built successfully"

cd ..

# Build frontend
print_info "Building frontend..."
cd client
npm run build
print_success "Frontend built successfully"

cd ..

echo ""
echo "6️⃣  Verifying TypeScript compilation..."

# Verify backend TypeScript
print_info "Checking backend TypeScript..."
cd BACKEND
if npm run lint &> /dev/null; then
    print_success "Backend TypeScript: 0 errors"
else
    print_error "Backend TypeScript has errors"
fi

cd ..

echo ""
echo "7️⃣  Testing database connection..."

# Test database schema
print_info "Initializing database schema..."
cd BACKEND

# Create a test file to initialize database
cat > test-db.js << 'EOF'
const { initDatabase } = require('./dist/src/database/connection.js');

initDatabase()
  .then(() => {
    console.log('Database initialized successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  });
EOF

if node test-db.js; then
    print_success "Database schema initialized"
    rm test-db.js
else
    print_error "Database schema initialization failed"
    rm test-db.js
fi

cd ..

echo ""
echo "✅ Setup Complete!"
echo "=================="
echo ""
echo "📊 Configuration Summary:"
echo "  Database: $DB_NAME"
echo "  Backend:  http://localhost:3001"
echo "  Frontend: http://localhost:5173"
echo ""
echo "🚀 To start the servers:"
echo ""
echo "  # Terminal 1 - Backend"
echo "  cd BACKEND && npm run dev"
echo ""
echo "  # Terminal 2 - Frontend"
echo "  cd client && npm run dev"
echo ""
echo "📝 Next steps:"
echo "  1. Add your HuggingFace token to BACKEND/.env (optional)"
echo "  2. Start the servers using the commands above"
echo "  3. Open http://localhost:5173 in your browser"
echo ""
echo "📚 Documentation:"
echo "  - Implementation: IMPLEMENTATION_REPORT.md"
echo "  - Deployment: DEPLOYMENT_GUIDE.md"
echo "  - Checklist: COMPLETE_CHECKLIST.md"
echo ""
print_success "All done! Happy coding! 🎉"
