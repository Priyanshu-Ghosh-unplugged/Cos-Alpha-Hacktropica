const WebSocket = require('ws');

console.log('🧪 Testing Presage WebSocket connection...');

const ws = new WebSocket('ws://localhost:9002');

ws.on('open', () => {
    console.log('✅ Connected to Presage server');
    
    // Test start measurement
    console.log('📤 Sending start_measurement...');
    ws.send(JSON.stringify({ type: 'start_measurement' }));
    
    // Test get status
    setTimeout(() => {
        console.log('📤 Sending get_status...');
        ws.send(JSON.stringify({ type: 'get_status' }));
    }, 2000);
    
    // Test stop measurement
    setTimeout(() => {
        console.log('📤 Sending stop_measurement...');
        ws.send(JSON.stringify({ type: 'stop_measurement' }));
    }, 4000);
    
    // Close connection after test
    setTimeout(() => {
        console.log('📤 Closing connection...');
        ws.close();
    }, 6000);
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data);
        console.log('📨 Received:', JSON.stringify(message, null, 2));
        
        if (message.type === 'vitals' && message.data) {
            const vitals = message.data;
            console.log(`🫀 Heart Rate: ${vitals.heart_rate} BPM`);
            console.log(`🫁 Breathing Rate: ${vitals.breathing_rate} breaths/min`);
            console.log(`🧠 HRV: ${vitals.heart_rate_variability} ms`);
            console.log(`😰 Stress Level: ${(vitals.stress_level * 100).toFixed(1)}%`);
            console.log(`⏱️ Timestamp: ${vitals.timestamp}`);
            console.log(`📊 Status: ${vitals.status}`);
        }
    } catch (error) {
        console.log('📨 Received raw:', data.toString());
    }
});

ws.on('close', () => {
    console.log('❌ Disconnected from server');
});

ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
});

// Timeout after 10 seconds
setTimeout(() => {
    if (ws.readyState === WebSocket.OPEN) {
        console.log('⏰ Test timeout, closing connection...');
        ws.close();
    }
}, 10000);
