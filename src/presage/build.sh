#!/bin/bash

# Presage Vital Signs Integration Build Script

set -e

echo "🔧 Building Presage Vital Signs Integration..."

# Check if we're in the right directory
if [ ! -f "CMakeLists.txt" ]; then
    echo "❌ Error: CMakeLists.txt not found. Please run this script from the presage directory."
    exit 1
fi

# Create build directory
echo "📁 Creating build directory..."
mkdir -p build
cd build

# Configure with CMake
echo "⚙️  Configuring with CMake..."
cmake .. -DCMAKE_BUILD_TYPE=Release

# Build
echo "🔨 Building..."
make -j$(nproc)

echo "✅ Build completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Get your API key from https://physiology.presagetech.com"
echo "2. Replace 'YOUR_API_KEY_HERE' in ../hello_vitals.cpp"
echo "3. Run: ./hello_vitals"
echo ""
echo "🌐 The WebSocket server will start on ws://localhost:9002"
echo "🖥️  Access the health dashboard at http://localhost:5173/health"
