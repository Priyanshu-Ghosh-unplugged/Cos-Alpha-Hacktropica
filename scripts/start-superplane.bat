@echo off
REM SuperPlane Integration Script for Cos-alpha (Windows)
echo 🚀 Starting SuperPlane integration for Cos-alpha...

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker first.
    pause
    exit /b 1
)

REM Create necessary directories
echo 📁 Creating directories...
if not exist "superplane-config\workflows" mkdir "superplane-config\workflows"
if not exist "superplane-data" mkdir "superplane-data"
if not exist "logs\superplane" mkdir "logs\superplane"

REM Set environment variables
echo ⚙️ Setting up environment...
set SUPERPLANE_API_PORT=3000
set SUPERPLANE_UI_PORT=3001
set WEBHOOK_BASE_URL=http://localhost:8000/api/superplane
set ALGORAND_NODE_URL=https://testnet-api.algorand.cloud
set STELLAR_RPC_URL=https://soroban-testnet.stellar.org
set SOLANA_RPC_URL=https://api.devnet.solana.com
set SUPERPLANE_WEBHOOK_SECRET=your-webhook-secret-here

REM Start SuperPlane services
echo 🐳 Starting SuperPlane services...
docker-compose -f docker-compose.superplane.yml up -d

REM Wait for services to be ready
echo ⏳ Waiting for services to start...
timeout /t 10 /nobreak >nul

REM Check if SuperPlane is running
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SuperPlane API is running on http://localhost:3000
) else (
    echo ❌ SuperPlane API failed to start
    pause
    exit /b 1
)

curl -s http://localhost:3001 >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ SuperPlane UI is running on http://localhost:3001
) else (
    echo ❌ SuperPlane UI failed to start
    pause
    exit /b 1
)

REM Import workflows
echo 📋 Importing workflows...
for %%f in (superplane-config\workflows\*.json) do (
    echo Importing %%~nxf...
    curl -X POST -H "Content-Type: application/json" -d @"%%f" http://localhost:3000/api/workflows
)

REM Start the main application
echo 🎯 Starting Cos-alpha application...
start cmd /k "npm run dev"

echo 🎉 SuperPlane integration complete!
echo.
echo 📍 Access points:
echo    • SuperPlane UI: http://localhost:3001
echo    • SuperPlane API: http://localhost:3000
echo    • Cos-alpha App: http://localhost:5173
echo    • SuperPlane Dashboard: http://localhost:5173/superplane
echo.
echo 🔧 To stop all services:
echo    docker-compose -f docker-compose.superplane.yml down
echo.
echo 📊 To view logs:
echo    docker-compose -f docker-compose.superplane.yml logs -f
echo.
pause
