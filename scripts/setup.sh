#!/bin/bash
#
# LASTEDOCATION Setup Script
# Version: 1.0.0
#
# This script validates the environment and sets up the project
# Usage: bash scripts/setup.sh
#

set -e  # Exit on error

echo ""
echo "🚀 LASTEDOCATION Setup Script"
echo "=============================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Print status message
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check Python version
echo "Checking Python version..."
if command_exists python3; then
    python_version=$(python3 --version 2>&1 | grep -oP '\d+\.\d+' | head -1)
    python_major=$(echo $python_version | cut -d. -f1)
    python_minor=$(echo $python_version | cut -d. -f2)
    
    if [ "$python_major" -ge 3 ] && [ "$python_minor" -ge 10 ]; then
        print_status 0 "Python $python_version (OK)"
    else
        print_status 1 "Python $python_version (3.10+ required)"
        echo "Please install Python 3.10 or higher"
        exit 1
    fi
else
    print_status 1 "Python 3 not found"
    echo "Please install Python 3.10 or higher"
    exit 1
fi

# Check Node.js version
echo "Checking Node.js version..."
if command_exists node; then
    node_version=$(node --version | grep -oP '\d+' | head -1)
    
    if [ "$node_version" -ge 18 ]; then
        print_status 0 "Node.js v$node_version (OK)"
    else
        print_status 1 "Node.js v$node_version (18+ required)"
        echo "Please install Node.js 18 or higher"
        exit 1
    fi
else
    print_status 1 "Node.js not found"
    echo "Please install Node.js 18 or higher"
    exit 1
fi

# Check npm
echo "Checking npm..."
if command_exists npm; then
    npm_version=$(npm --version)
    print_status 0 "npm v$npm_version"
else
    print_status 1 "npm not found"
    exit 1
fi

# Check GPU availability
echo ""
echo "Checking GPU availability..."
if command_exists nvidia-smi; then
    gpu_info=$(nvidia-smi --query-gpu=name,memory.total --format=csv,noheader | head -1)
    print_status 0 "GPU detected: $gpu_info"
    export USE_GPU=true
else
    print_warning "No GPU detected - will use CPU (slower)"
    export USE_GPU=false
fi

# Check disk space
echo ""
echo "Checking disk space..."
available_space=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ "$available_space" -ge 20 ]; then
    print_status 0 "Disk space: ${available_space}GB available"
else
    print_warning "Low disk space: ${available_space}GB (20GB+ recommended)"
fi

# Create required directories
echo ""
echo "Creating required directories..."
mkdir -p logs
mkdir -p models/fine-tuned
mkdir -p data/downloads
mkdir -p BACKEND/temp/audio
mkdir -p test_results
print_status 0 "Directories created"

# Check for .env file
echo ""
echo "Checking environment configuration..."
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_warning "Created .env from .env.example - please configure it"
        echo "   Edit .env and set required variables:"
        echo "   - JWT_SECRET (generate with: openssl rand -base64 32)"
        echo "   - HF_TOKEN (optional, from https://huggingface.co/settings/tokens)"
    else
        print_warning "No .env file - create one with required variables"
    fi
else
    print_status 0 ".env file exists"
fi

# Verify dataset files
echo ""
echo "Verifying training dataset..."
if [ -f "combined.jsonl" ]; then
    line_count=$(wc -l < combined.jsonl)
    file_size=$(du -h combined.jsonl | cut -f1)
    print_status 0 "Dataset found: $line_count samples ($file_size)"
    
    # Verify checksum if available
    if [ -f "checksums/datasets.sha256.txt" ]; then
        if sha256sum -c checksums/datasets.sha256.txt 2>/dev/null; then
            print_status 0 "Dataset integrity verified"
        else
            print_warning "Dataset checksum mismatch"
        fi
    fi
else
    print_warning "combined.jsonl not found"
    echo "   Training dataset is missing. Download or generate it before training."
fi

# Run hardware detection
echo ""
echo "Detecting hardware configuration..."
if [ -f "scripts/detect_hardware.py" ]; then
    python3 scripts/detect_hardware.py
else
    print_warning "Hardware detection script not found"
fi

# Install Python dependencies
echo ""
echo "Installing Python dependencies..."
if [ -f "requirements.txt" ]; then
    pip3 install -q -r requirements.txt
    print_status 0 "Python dependencies installed"
else
    print_warning "requirements.txt not found"
fi

# Install Node.js dependencies
echo ""
echo "Installing Node.js dependencies..."
print_info "Installing backend dependencies..."
npm install --silent
print_status 0 "Backend dependencies installed"

print_info "Installing frontend dependencies..."
cd client && npm install --silent && cd ..
print_status 0 "Frontend dependencies installed"

# Build frontend (optional)
echo ""
read -p "Build frontend now? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_info "Building frontend..."
    cd client && npm run build && cd ..
    print_status 0 "Frontend built"
fi

# Final summary
echo ""
echo "=============================="
echo "✅ Setup Complete!"
echo "=============================="
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Configure environment variables:"
echo "   - Edit .env file"
echo "   - Set JWT_SECRET (required)"
echo "   - Set HF_TOKEN (optional, for HuggingFace API)"
echo ""
echo "2. Start the backend server:"
echo "   npm run dev"
echo ""
echo "3. Start the frontend (in another terminal):"
echo "   cd client && npm run dev"
echo ""
echo "4. Run health check to verify setup:"
echo "   npm run health-check"
echo ""
echo "5. (Optional) Train a model:"
echo "   python3 scripts/train_cpu.py --epochs 3"
echo ""

if [ "$USE_GPU" = false ]; then
    echo "⚠️  NOTE: No GPU detected. Training will be slow on CPU."
    echo "   Consider using Google Colab for faster training:"
    echo "   https://colab.research.google.com/"
    echo ""
fi

echo "For more information, see:"
echo "  - README.md"
echo "  - docs/SETUP.md"
echo "  - docs/IMPLEMENTATION_STATUS.md"
echo ""
