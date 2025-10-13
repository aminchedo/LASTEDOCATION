#!/bin/bash

echo "🛑 Stopping Persian TTS/AI Platform"
echo "===================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

# PID file locations
BACKEND_PID_FILE=".backend.pid"
CLIENT_PID_FILE=".client.pid"

# Function to stop process
stop_process() {
    local name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        
        if ps -p "$PID" > /dev/null 2>&1; then
            echo "Stopping $name (PID: $PID)..."
            kill "$PID" 2>/dev/null
            
            # Wait up to 5 seconds for graceful shutdown
            for i in {1..5}; do
                if ! ps -p "$PID" > /dev/null 2>&1; then
                    break
                fi
                sleep 1
            done
            
            # Force kill if still running
            if ps -p "$PID" > /dev/null 2>&1; then
                echo "Force killing $name..."
                kill -9 "$PID" 2>/dev/null
            fi
            
            echo -e "${GREEN}✅ $name stopped${NC}"
        else
            echo -e "${YELLOW}ℹ️  $name was not running${NC}"
        fi
        
        rm -f "$pid_file"
    else
        echo -e "${YELLOW}ℹ️  No PID file found for $name${NC}"
    fi
}

# Stop backend
stop_process "Backend" "$BACKEND_PID_FILE"

# Stop client
stop_process "Client" "$CLIENT_PID_FILE"

# Also kill any remaining Node processes related to the project
echo ""
echo "🔍 Checking for orphaned processes..."

# Kill any remaining backend processes
pkill -f "ts-node.*server.ts" 2>/dev/null && echo -e "${GREEN}✅ Cleaned up backend processes${NC}"

# Kill any remaining Vite processes
pkill -f "vite" 2>/dev/null && echo -e "${GREEN}✅ Cleaned up Vite processes${NC}"

echo ""
echo "===================================="
echo -e "${GREEN}🎉 Platform stopped successfully${NC}"
echo "===================================="
