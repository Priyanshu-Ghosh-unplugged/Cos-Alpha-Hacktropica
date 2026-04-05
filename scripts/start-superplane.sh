#!/bin/bash

# SuperPlane Integration Script for Cos-alpha
echo "🚀 Starting SuperPlane integration for Cos-alpha..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating directories..."
mkdir -p superplane-config/workflows
mkdir -p superplane-data
mkdir -p logs/superplane

# Set environment variables
echo "⚙️ Setting up environment..."
export SUPERPLANE_API_PORT=3000
export SUPERPLANE_UI_PORT=3001
export WEBHOOK_BASE_URL=http://localhost:8000/api/superplane
export ALGORAND_NODE_URL=https://testnet-api.algorand.cloud
export STELLAR_RPC_URL=https://soroban-testnet.stellar.org
export SOLANA_RPC_URL=https://api.devnet.solana.com
export SUPERPLANE_WEBHOOK_SECRET=your-webhook-secret-here

# Start SuperPlane services
echo "🐳 Starting SuperPlane services..."
docker-compose -f docker-compose.superplane.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 10

# Check if SuperPlane is running
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ SuperPlane API is running on http://localhost:3000"
else
    echo "❌ SuperPlane API failed to start"
    exit 1
fi

if curl -s http://localhost:3001 > /dev/null; then
    echo "✅ SuperPlane UI is running on http://localhost:3001"
else
    echo "❌ SuperPlane UI failed to start"
    exit 1
fi

# Import workflows
echo "📋 Importing workflows..."
for workflow in superplane-config/workflows/*.json; do
    if [ -f "$workflow" ]; then
        echo "Importing $(basename "$workflow")..."
        curl -X POST \
            -H "Content-Type: application/json" \
            -d @"$workflow" \
            http://localhost:3000/api/workflows
    fi
done

# Start the main application
echo "🎯 Starting Cos-alpha application..."
npm run dev &

echo "🎉 SuperPlane integration complete!"
echo ""
echo "📍 Access points:"
echo "   • SuperPlane UI: http://localhost:3001"
echo "   • SuperPlane API: http://localhost:3000"
echo "   • Cos-alpha App: http://localhost:5173"
echo "   • SuperPlane Dashboard: http://localhost:5173/superplane"
echo ""
echo "🔧 To stop all services:"
echo "   docker-compose -f docker-compose.superplane.yml down"
echo ""
echo "📊 To view logs:"
echo "   docker-compose -f docker-compose.superplane.yml logs -f"
