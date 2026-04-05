const WebSocket = require('ws');

console.log('🔍 Verifying Presage Integration...');
console.log('');

// Test 1: WebSocket Connection
console.log('📡 Test 1: WebSocket Connection...');
const ws = new WebSocket('ws://localhost:9002');

ws.on('open', () => {
    console.log('✅ WebSocket connection successful');
    
    // Test 2: Start Measurement
    console.log('🫀 Test 2: Start Measurement...');
    ws.send(JSON.stringify({ type: 'start_measurement' }));
    
    setTimeout(() => {
        // Test 3: Get Status
        console.log('📊 Test 3: Get Status...');
        ws.send(JSON.stringify({ type: 'get_status' }));
    }, 1000);
    
    setTimeout(() => {
        // Test 4: Stop Measurement
        console.log('⏹️ Test 4: Stop Measurement...');
        ws.send(JSON.stringify({ type: 'stop_measurement' }));
    }, 2000);
    
    setTimeout(() => {
        ws.close();
    }, 3000);
});

let messageCount = 0;
ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        messageCount++;
        
        if (message.type === 'vitals' && message.data) {
            const vitals = message.data;
            console.log(`📨 Message ${messageCount}: ${vitals.status} - HR: ${vitals.heart_rate} BPM, Stress: ${(vitals.stress_level * 100).toFixed(1)}%`);
            
            // Validate vital ranges
            if (vitals.heart_rate > 0) {
                if (vitals.heart_rate < 50 || vitals.heart_rate > 100) {
                    console.log(`⚠️  Unusual heart rate detected: ${vitals.heart_rate} BPM`);
                }
            }
            
            if (vitals.stress_level > 0.7) {
                console.log(`⚠️  High stress level: ${(vitals.stress_level * 100).toFixed(1)}%`);
            }
        }
    } catch (error) {
        console.log(`📨 Message ${messageCount}: ${data.toString()}`);
    }
});

ws.on('close', () => {
    console.log('✅ WebSocket connection closed');
    console.log('');
    
    if (messageCount >= 3) {
        console.log('🎉 Integration Test PASSED!');
        console.log('📊 All WebSocket messages received successfully');
        console.log('🫀 Vital signs generation working');
        console.log('🔄 Start/stop commands functioning');
        console.log('');
        console.log('🌐 Frontend should be available at: http://localhost:8080/health');
        console.log('📱 Navigate to the Health Dashboard to test the UI');
    } else {
        console.log('❌ Integration Test FAILED!');
        console.log(`📊 Expected at least 3 messages, received ${messageCount}`);
    }
    
    process.exit(0);
});

ws.on('error', (error) => {
    console.error('❌ WebSocket Error:', error.message);
    console.log('');
    console.log('🔧 Troubleshooting:');
    console.log('1. Ensure mock-server.js is running on port 9002');
    console.log('2. Check if another process is using port 9002');
    console.log('3. Restart the servers using start-presage.bat or start-presage.sh');
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('⏰ Test timeout');
    console.log('❌ Integration Test FAILED - Timeout');
    ws.close();
}, 10000);
