#!/bin/bash

echo "🔐 Environment Setup - Persian TTS/AI Platform"
echo "=============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Generate secure random secrets
generate_secret() {
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
    else
        # Fallback to /dev/urandom
        cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 64 | head -n 1
    fi
}

JWT_SECRET=$(generate_secret)
SESSION_SECRET=$(generate_secret)

echo "📝 Please provide the following configuration:"
echo ""

# Database configuration
echo "Database Configuration:"
echo "----------------------"
read -p "PostgreSQL Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "PostgreSQL Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

read -p "Database Name [persian_tts]: " DB_NAME
DB_NAME=${DB_NAME:-persian_tts}

read -p "Database User [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Database Password [postgres]: " DB_PASSWORD
echo ""
DB_PASSWORD=${DB_PASSWORD:-postgres}

# Construct DATABASE_URL
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}"

echo ""
echo "API Configuration:"
echo "-------------------"
read -p "HuggingFace Token (optional): " HF_TOKEN

read -p "Backend Port [3001]: " BACKEND_PORT
BACKEND_PORT=${BACKEND_PORT:-3001}

read -p "Client URL [http://localhost:5173]: " CLIENT_URL
CLIENT_URL=${CLIENT_URL:-http://localhost:5173}

echo ""
echo "Environment:"
echo "------------"
read -p "Node Environment [development]: " NODE_ENV
NODE_ENV=${NODE_ENV:-development}

read -p "Log Level [info]: " LOG_LEVEL
LOG_LEVEL=${LOG_LEVEL:-info}

# Create backend .env file
echo ""
echo "📄 Creating BACKEND/.env file..."

cat > BACKEND/.env <<EOF
# Environment Configuration
NODE_ENV=${NODE_ENV}
PORT=${BACKEND_PORT}

# Database Configuration
DATABASE_URL=${DATABASE_URL}
DB_HOST=${DB_HOST}
DB_PORT=${DB_PORT}
DB_NAME=${DB_NAME}
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}

# Security
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# HuggingFace API
HF_TOKEN=${HF_TOKEN}

# CORS
CORS_ORIGIN=${CLIENT_URL}

# Logging
LOG_LEVEL=${LOG_LEVEL}
LOG_DIR=logs

# Directories
MODELS_DIR=models
DATA_DIR=data
EOF

echo -e "${GREEN}✅ Backend environment configured${NC}"

# Create client .env file (if client directory exists)
if [ -d "client" ]; then
    echo ""
    echo "📄 Creating client/.env file..."
    
    cat > client/.env <<EOF
# API Configuration
VITE_API_URL=http://localhost:${BACKEND_PORT}
VITE_WS_URL=ws://localhost:${BACKEND_PORT}

# Environment
VITE_NODE_ENV=${NODE_ENV}
EOF

    echo -e "${GREEN}✅ Client environment configured${NC}"
fi

echo ""
echo "=============================================="
echo -e "${GREEN}🎉 Environment setup complete!${NC}"
echo ""
echo "Configuration summary:"
echo "  - Database: ${DB_NAME} at ${DB_HOST}:${DB_PORT}"
echo "  - Backend:  http://localhost:${BACKEND_PORT}"
echo "  - Client:   ${CLIENT_URL}"
echo "  - Log Level: ${LOG_LEVEL}"
echo ""
echo "Files created:"
echo "  - BACKEND/.env"
if [ -d "client" ]; then
    echo "  - client/.env"
fi
echo ""
echo "⚠️  IMPORTANT: Keep .env files secure and never commit them to git!"
echo "=============================================="
