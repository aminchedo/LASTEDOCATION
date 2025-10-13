#!/bin/bash

echo "🚀 Starting Persian TTS/AI Platform"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# PID file locations
BACKEND_PID_FILE=".backend.pid"
CLIENT_PID_FILE=".client.pid"

# Check if already running
if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Backend is already running (PID: $BACKEND_PID)${NC}"
        echo "Run './stop.sh' first to stop existing processes"
        exit 1
    else
        rm -f "$BACKEND_PID_FILE"
    fi
fi

if [ -f "$CLIENT_PID_FILE" ]; then
    CLIENT_PID=$(cat "$CLIENT_PID_FILE")
    if ps -p "$CLIENT_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Client is already running (PID: $CLIENT_PID)${NC}"
        echo "Run './stop.sh' first to stop existing processes"
        exit 1
    else
        rm -f "$CLIENT_PID_FILE"
    fi
fi

# Function to start backend
start_backend() {
    echo "🔧 Starting backend server..."
    cd BACKEND
    
    # Start backend in background and capture PID
    npm run dev > ../logs/backend.log 2>&1 &
    BACKEND_PID=$!
    
    echo "$BACKEND_PID" > "../$BACKEND_PID_FILE"
    cd ..
    
    echo -e "${GREEN}✅ Backend started (PID: $BACKEND_PID)${NC}"
    echo "   Logs: logs/backend.log"
}

# Function to start client
start_client() {
    echo "🎨 Starting client dev server..."
    cd client
    
    # Start client in background and capture PID
    npm run dev > ../logs/client.log 2>&1 &
    CLIENT_PID=$!
    
    echo "$CLIENT_PID" > "../$CLIENT_PID_FILE"
    cd ..
    
    echo -e "${GREEN}✅ Client started (PID: $CLIENT_PID)${NC}"
    echo "   Logs: logs/client.log"
}

# Create logs directory if it doesn't exist
mkdir -p logs

# Start services
start_backend
sleep 3  # Give backend time to start
start_client

echo ""
echo "===================================="
echo -e "${GREEN}🎉 Platform started successfully!${NC}"
echo ""
echo "Access the application:"
echo -e "${BLUE}  • Client:  http://localhost:5173${NC}"
echo -e "${BLUE}  • API:     http://localhost:3001${NC}"
echo -e "${BLUE}  • Health:  http://localhost:3001/health${NC}"
echo ""
echo "Log files:"
echo "  • Backend: logs/backend.log"
echo "  • Client:  logs/client.log"
echo ""
echo "To view logs in real-time:"
echo "  tail -f logs/backend.log"
echo "  tail -f logs/client.log"
echo ""
echo "To stop all services:"
echo "  ./stop.sh"
echo "===================================="

# Wait a bit and check if processes are still running
sleep 5

if [ -f "$BACKEND_PID_FILE" ]; then
    BACKEND_PID=$(cat "$BACKEND_PID_FILE")
    if ! ps -p "$BACKEND_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Warning: Backend process stopped unexpectedly${NC}"
        echo "   Check logs/backend.log for errors"
        rm -f "$BACKEND_PID_FILE"
    fi
fi

if [ -f "$CLIENT_PID_FILE" ]; then
    CLIENT_PID=$(cat "$CLIENT_PID_FILE")
    if ! ps -p "$CLIENT_PID" > /dev/null 2>&1; then
        echo -e "${YELLOW}⚠️  Warning: Client process stopped unexpectedly${NC}"
        echo "   Check logs/client.log for errors"
        rm -f "$CLIENT_PID_FILE"
    fi
fi

# Option to open browser
if command -v xdg-open >/dev/null 2>&1; then
    read -p "Open browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open http://localhost:5173
    fi
elif command -v open >/dev/null 2>&1; then
    read -p "Open browser? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open http://localhost:5173
    fi
fi
