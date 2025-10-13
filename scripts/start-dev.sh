#!/bin/bash

# Development Startup Script
# Starts backend and frontend with monitoring enabled

set -e

echo "🚀 Starting Persian TTS Development Environment..."
echo ""

# Check if .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "📋 Creating .env from .env.example..."
        cp .env.example .env
        echo "⚠️  Please update .env with your configuration"
        echo ""
    else
        echo "❌ No .env.example found. Please create .env manually."
        exit 1
    fi
fi

# Check if Docker is running (optional)
if command -v docker &> /dev/null; then
    if docker ps &> /dev/null; then
        echo "🐳 Docker is running"
        
        # Ask if user wants to start with Docker
        read -p "Start with Docker Compose? (y/n) " -n 1 -r
        echo ""
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🐳 Starting services with Docker Compose..."
            docker-compose up -d
            
            echo ""
            echo "✅ Services started!"
            echo ""
            echo "Access:"
            echo "  - Backend: http://localhost:3001"
            echo "  - Frontend: http://localhost:80"
            echo "  - Health: http://localhost:3001/health"
            echo "  - Monitoring: http://localhost:3001/api/monitoring/system"
            echo ""
            echo "View logs:"
            echo "  docker-compose logs -f"
            echo ""
            exit 0
        fi
    fi
fi

# Start without Docker
echo "📦 Installing dependencies..."
echo ""

# Install backend dependencies
if [ -d "BACKEND" ]; then
    echo "Installing backend dependencies..."
    cd BACKEND
    npm install --silent
    cd ..
fi

# Install frontend dependencies
if [ -d "client" ]; then
    echo "Installing frontend dependencies..."
    cd client
    npm install --silent
    cd ..
fi

echo ""
echo "✅ Dependencies installed"
echo ""

# Start services
echo "🚀 Starting services..."
echo ""

# Check if concurrently is available
if command -v concurrently &> /dev/null || npm list -g concurrently &> /dev/null; then
    echo "Using concurrently to start both services..."
    npm run dev
else
    echo "⚠️  concurrently not found. Starting backend only."
    echo ""
    echo "To start both backend and frontend:"
    echo "  Terminal 1: cd BACKEND && npm run dev"
    echo "  Terminal 2: cd client && npm run dev"
    echo ""
    
    cd BACKEND
    npm run dev
fi
