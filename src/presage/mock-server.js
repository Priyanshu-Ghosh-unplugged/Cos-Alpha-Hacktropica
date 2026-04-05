const WebSocket = require('ws');
const http = require('http');

// Mock vital data generator
class MockVitalGenerator {
    constructor() {
        this.baseHeartRate = 70;
        this.baseBreathingRate = 16;
        this.baseHRV = 45;
        this.isMeasuring = false;
        this.interval = null;
    }

    generateVitals() {
        if (!this.isMeasuring) {
            return {
                heart_rate: 0,
                breathing_rate: 0,
                heart_rate_variability: 0,
                stress_level: 0,
                is_measuring: false,
                timestamp: new Date().toISOString(),
                status: 'idle'
            };
        }

        // Generate realistic vital signs with some variation
        const heartRate = this.baseHeartRate + (Math.random() - 0.5) * 10;
        const breathingRate = this.baseBreathingRate + (Math.random() - 0.5) * 4;
        const hrv = this.baseHRV + (Math.random() - 0.5) * 15;
        
        // Calculate stress level based on HR and HRV
        const stressIndicator = (heartRate - 60) / 40;
        const hrvIndicator = (50 - hrv) / 50;
        const stressLevel = Math.max(0, Math.min(1, (stressIndicator + hrvIndicator) / 2));

        return {
            heart_rate: Math.round(heartRate * 10) / 10,
            breathing_rate: Math.round(breathingRate * 10) / 10,
            heart_rate_variability: Math.round(hrv * 10) / 10,
            stress_level: Math.round(stressLevel * 100) / 100,
            is_measuring: true,
            timestamp: new Date().toISOString(),
            status: 'measuring'
        };
    }

    startMeasurement() {
        this.isMeasuring = true;
        console.log('🫀 Started vital measurement');
    }

    stopMeasurement() {
        this.isMeasuring = false;
        console.log('⏹️ Stopped vital measurement');
    }
}

// Create WebSocket server
const wss = new WebSocket.Server({ port: 9002 });
const vitalGenerator = new MockVitalGenerator();
const clients = new Set();

console.log('🚀 Mock Presage WebSocket Server starting on port 9002...');

wss.on('connection', (ws) => {
    console.log('📱 Client connected');
    clients.add(ws);

    // Send initial status
    ws.send(JSON.stringify({
        type: 'vitals',
        data: vitalGenerator.generateVitals()
    }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            console.log('📨 Received:', data.type);

            switch (data.type) {
                case 'start_measurement':
                    vitalGenerator.startMeasurement();
                    break;
                case 'stop_measurement':
                    vitalGenerator.stopMeasurement();
                    break;
                case 'get_status':
                    // Just send current status
                    break;
            }

            // Broadcast updated status to all clients
            broadcastVitals();
        } catch (error) {
            console.error('❌ Error parsing message:', error);
        }
    });

    ws.on('close', () => {
        console.log('📱 Client disconnected');
        clients.delete(ws);
    });

    ws.on('error', (error) => {
        console.error('❌ WebSocket error:', error);
        clients.delete(ws);
    });
});

// Broadcast vital data to all clients
function broadcastVitals() {
    const vitals = vitalGenerator.generateVitals();
    const message = JSON.stringify({
        type: 'vitals',
        data: vitals
    });

    clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
}

// Simulate vital updates every 2 seconds when measuring
setInterval(() => {
    if (vitalGenerator.isMeasuring) {
        broadcastVitals();
    }
}, 2000);

// Send periodic status updates
setInterval(() => {
    if (!vitalGenerator.isMeasuring) {
        broadcastVitals();
    }
}, 5000);

console.log('✅ Mock Presage Server is running!');
console.log('📊 WebSocket: ws://localhost:9002');
console.log('🌐 Frontend should connect to this server');
console.log('🫀 Generating mock vital data...');
console.log('⏹️ Press Ctrl+C to stop');

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down server...');
    wss.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});
