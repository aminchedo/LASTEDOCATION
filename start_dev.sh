#!/bin/bash
# Development startup script

echo "🚀 Starting LASTEDOCATION ML Pipeline (Development Mode)"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start ML Service
echo "📦 Starting ML Service..."
cd ml_service
python3 -m uvicorn app:app --host 0.0.0.0 --port 8000 --reload &
ML_PID=$!
cd ..

sleep 3
echo "✓ ML Service started (PID: $ML_PID)"

# Start Backend
echo "📦 Starting Backend..."
cd BACKEND
npm run dev &
BACKEND_PID=$!
cd ..

sleep 3
echo "✓ Backend started (PID: $BACKEND_PID)"

# Start Frontend
echo "📦 Starting Frontend..."
cd client
npm run dev &
CLIENT_PID=$!
cd ..

sleep 3
echo "✓ Frontend started (PID: $CLIENT_PID)"

echo ""
echo "════════════════════════════════════════════════════════"
echo "  ✅ All services running!"
echo "════════════════════════════════════════════════════════"
echo ""
echo "  ML Service:  http://localhost:8000/health"
echo "  Backend:     http://localhost:3001/api/health"
echo "  Frontend:    http://localhost:3000"
echo ""
echo "  ML Training: http://localhost:3000/ml-train"
echo "  ML Predict:  http://localhost:3000/ml-predict"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap Ctrl+C to kill all processes
trap "echo ''; echo '🛑 Stopping all services...'; kill $ML_PID $BACKEND_PID $CLIENT_PID 2>/dev/null; exit" INT

# Wait for all processes
wait
