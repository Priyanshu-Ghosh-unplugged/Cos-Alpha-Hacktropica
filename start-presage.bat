@echo off
echo 🚀 Starting Presage Vital Signs Integration...
echo.

echo � Checking dependencies...
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

echo �📡 Starting Mock Presage WebSocket Server...
start "Presage Server" cmd /k "cd /d %~dp0\src\presage && node mock-server.js"

echo ⏳ Waiting for server to start...
timeout /t 3 /nobreak >nul

echo 🌐 Starting React Development Server...
start "React App" cmd /k "cd /d %~dp0 && npm run dev"

echo ⏳ Waiting for React server to start...
timeout /t 5 /nobreak >nul

echo.
echo ✅ Both servers are starting!
echo.

echo 🧪 Running integration test...
cd /d %~dp0
node verify-integration.cjs

echo.
echo 📊 Presage WebSocket: ws://localhost:9002
echo 🌐 React App: http://localhost:8080
echo 🏥 Health Dashboard: http://localhost:8080/health
echo.
echo 📋 Usage:
echo    1. Open http://localhost:8080/health in your browser
echo    2. Click "Start Measurement" to begin vital monitoring
echo    3. View real-time vital signs and health recommendations
echo.
echo ⏹️  Press Ctrl+C in each server window to stop
echo.

pause
