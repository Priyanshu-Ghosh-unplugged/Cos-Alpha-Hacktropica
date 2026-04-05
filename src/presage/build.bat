@echo off
REM Presage Vital Signs Integration Build Script (Windows)

echo 🔧 Building Presage Vital Signs Integration...

REM Check if we're in the right directory
if not exist "CMakeLists.txt" (
    echo ❌ Error: CMakeLists.txt not found. Please run this script from the presage directory.
    pause
    exit /b 1
)

REM Create build directory
echo 📁 Creating build directory...
if not exist "build" mkdir build
cd build

REM Configure with CMake
echo ⚙️  Configuring with CMake...
cmake .. -DCMAKE_BUILD_TYPE=Release

REM Build
echo 🔨 Building...
cmake --build . --config Release

echo ✅ Build completed successfully!
echo.
echo 📋 Next steps:
echo 1. Get your API key from https://physiology.presagetech.com
echo 2. Replace 'YOUR_API_KEY_HERE' in ..\hello_vitals.cpp
echo 3. Run: .\Release\hello_vitals.exe
echo.
echo 🌐 The WebSocket server will start on ws://localhost:9002
echo 🖥️  Access the health dashboard at http://localhost:5173/health

pause
