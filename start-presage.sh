#!/bin/bash

echo "🚀 Starting Presage Vital Signs Integration..."
echo ""

echo "📡 Starting Mock Presage WebSocket Server..."
cd "$(dirname "$0")/src/presage"
node mock-server.js &
PRESAGE_PID=$!

echo "⏳ Waiting for server to start..."
sleep 3

echo "🌐 Starting React Development Server..."
cd "$(dirname "$0")"
npm run dev &
REACT_PID=$!

echo ""
echo "✅ Both servers are starting!"
echo ""
echo "📊 Presage WebSocket: ws://localhost:9002"
echo "🌐 React App: http://localhost:8080"
echo "🏥 Health Dashboard: http://localhost:8080/health"
echo ""
echo "📋 Usage:"
echo "   1. Open http://localhost:8080/health in your browser"
echo "   2. Click 'Start Measurement' to begin vital monitoring"
echo "   3. View real-time vital signs and health recommendations"
echo ""
echo "⏹️  Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stopping servers..."
    kill $PRESAGE_PID 2>/dev/null
    kill $REACT_PID 2>/dev/null
    echo "✅ All servers stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Wait for processes
wait
