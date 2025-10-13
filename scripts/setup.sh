#!/bin/bash

#####################################################################
# Model Training Project - Setup Script
# 
# This script automates the setup process for the model training
# project, including dependency installation, configuration, and
# environment validation.
#####################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Header
echo "======================================================================"
echo "  Model Training Project - Automated Setup"
echo "======================================================================"
echo ""

# Check prerequisites
log_info "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    log_error "Node.js is not installed. Please install Node.js 20+ first."
    exit 1
fi
NODE_VERSION=$(node -v)
log_success "Node.js found: $NODE_VERSION"

# Check npm
if ! command -v npm &> /dev/null; then
    log_error "npm is not installed."
    exit 1
fi
NPM_VERSION=$(npm -v)
log_success "npm found: v$NPM_VERSION"

# Check Python
if ! command -v python3 &> /dev/null; then
    log_warning "Python 3 is not installed. Training will use simulation mode."
    PYTHON_AVAILABLE=false
else
    PYTHON_VERSION=$(python3 --version)
    log_success "Python found: $PYTHON_VERSION"
    PYTHON_AVAILABLE=true
fi

# Check pip
if ! command -v pip3 &> /dev/null; then
    log_warning "pip3 is not installed. Cannot install Python dependencies."
    PIP_AVAILABLE=false
else
    PIP_VERSION=$(pip3 --version)
    log_success "pip3 found: $PIP_VERSION"
    PIP_AVAILABLE=true
fi

echo ""
log_info "Installing Node.js dependencies..."

# Install root dependencies
log_info "Installing root dependencies..."
npm install --silent
log_success "Root dependencies installed"

# Install backend dependencies
log_info "Installing backend dependencies..."
cd BACKEND
npm install --silent
log_success "Backend dependencies installed"
cd ..

# Install frontend dependencies
log_info "Installing frontend dependencies..."
cd client
npm install --silent
log_success "Frontend dependencies installed"
cd ..

echo ""

# Install Python dependencies
if [ "$PYTHON_AVAILABLE" = true ] && [ "$PIP_AVAILABLE" = true ]; then
    log_info "Installing Python dependencies..."
    
    if pip3 install -r requirements.txt; then
        log_success "Python dependencies installed (PyTorch, Transformers, etc.)"
    else
        log_warning "Some Python packages failed to install. Training may use simulation mode."
    fi
else
    log_warning "Skipping Python dependencies (Python/pip not available)"
    log_warning "Training will use simulation mode until PyTorch is installed"
fi

echo ""
log_info "Setting up environment configuration..."

# Setup environment files
if [ ! -f ".env" ]; then
    log_info "Creating root .env file..."
    cp .env.example .env
    log_success "Created .env from .env.example"
else
    log_info ".env already exists, skipping..."
fi

if [ ! -f "BACKEND/.env" ]; then
    log_info "Creating backend .env file..."
    cp BACKEND/.env.example BACKEND/.env
    log_success "Created BACKEND/.env from .env.example"
else
    log_info "BACKEND/.env already exists, skipping..."
fi

if [ ! -f "client/.env" ]; then
    log_info "Creating frontend .env file..."
    cp client/.env.example client/.env
    log_success "Created client/.env from .env.example"
else
    log_info "client/.env already exists, skipping..."
fi

echo ""
log_info "Creating necessary directories..."

# Create directories
mkdir -p models data/datasets logs uploads BACKEND/logs

log_success "Directories created"

echo ""
log_info "Building backend..."

# Build backend
cd BACKEND
npm run build
log_success "Backend built successfully"
cd ..

echo ""
log_info "Building frontend..."

# Build frontend
cd client
npm run build
log_success "Frontend built successfully"
cd ..

echo ""
log_info "Making scripts executable..."

# Make scripts executable
chmod +x scripts/*.py 2>/dev/null || true
chmod +x scripts/*.sh 2>/dev/null || true

log_success "Scripts are now executable"

echo ""
log_info "Validating environment..."

# Check JWT_SECRET
if grep -q "change-me" .env || grep -q "change-me" BACKEND/.env; then
    log_warning "JWT_SECRET is still set to default value"
    log_warning "Please update JWT_SECRET in BACKEND/.env before running in production"
    log_warning "Generate a secure secret with: openssl rand -base64 32"
fi

echo ""
echo "======================================================================"
log_success "Setup completed successfully!"
echo "======================================================================"
echo ""

# Final instructions
log_info "Next steps:"
echo ""
echo "  1. Configure environment variables:"
echo "     ${BLUE}nano BACKEND/.env${NC}"
echo "     Set JWT_SECRET to a strong random string"
echo ""
echo "  2. Start the development servers:"
echo "     ${BLUE}npm run dev${NC}"
echo ""
echo "  3. Or start with Docker:"
echo "     ${BLUE}docker-compose up -d${NC}"
echo ""
echo "  4. Access the application:"
echo "     Frontend:  ${GREEN}http://localhost:3000${NC}"
echo "     Backend:   ${GREEN}http://localhost:3001${NC}"
echo "     Health:    ${GREEN}http://localhost:3001/health${NC}"
echo ""

if [ "$PYTHON_AVAILABLE" = false ] || [ "$PIP_AVAILABLE" = false ]; then
    log_warning "Python ML dependencies are not installed"
    echo "  To enable real training, install:"
    echo "     ${BLUE}pip3 install torch transformers datasets accelerate${NC}"
    echo ""
fi

log_info "Documentation:"
echo "  - Quick Setup:   ${BLUE}QUICK_SETUP_GUIDE.md${NC}"
echo "  - Deployment:    ${BLUE}DEPLOYMENT_GUIDE.md${NC}"
echo "  - Technical:     ${BLUE}MODEL_TRAINING_PROJECT_ANALYSIS_REPORT.md${NC}"
echo ""

log_success "Happy coding! 🚀"
