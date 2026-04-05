# Presage Vital Signs Integration

This directory contains the C++ backend for integrating Presage SmartSpectra SDK with the React frontend.

## Overview

The system consists of:
- **hello_vitals.cpp**: C++ application that uses Presage SDK to measure vital signs via camera
- **WebSocket Server**: Real-time communication bridge between C++ backend and React frontend
- **React Components**: Frontend interface for displaying vital signs and health recommendations

## Prerequisites

1. **Presage SmartSpectra SDK**: Install from the official Presage repository
2. **OpenCV**: For camera handling
3. **WebSocket++**: For WebSocket server functionality
4. **nlohmann JSON**: For JSON serialization

### Installation (Ubuntu/Debian)

```bash
# Add Presage repository
curl -s "https://presage-security.github.io/PPA/KEY.gpg" | gpg --dearmor | sudo tee /etc/apt/trusted.gpg.d/presage-technologies.gpg >/dev/null
sudo curl -s --compressed -o /etc/apt/sources.list.d/presage-technologies.list "https://presage-security.github.io/PPA/presage-technologies.list"

# Update package list
sudo apt update

# Install Presage SDK and dependencies
sudo apt install smartspectra-dev libopencv-dev websocketpp nlohmann-json3-dev build-essential cmake
```

### API Key Setup

1. Visit [https://physiology.presagetech.com](https://physiology.presagetech.com)
2. Register and obtain your free API key
3. Replace `YOUR_API_KEY_HERE` in `hello_vitals.cpp` with your actual API key

## Building

```bash
# Create build directory
mkdir build
cd build

# Configure with CMake
cmake ..

# Build
make

# Install (optional)
sudo make install
```

## Running

```bash
# From the build directory
./hello_vitals
```

The application will:
1. Start a WebSocket server on port 9002
2. Initialize the Presage SDK
3. Begin monitoring vital signs when requested
4. Stream real-time data to connected frontend clients

## WebSocket API

### Connection
- **URL**: `ws://localhost:9002`
- **Protocol**: WebSocket

### Messages

#### Start Measurement
```json
{
  "type": "start_measurement"
}
```

#### Stop Measurement
```json
{
  "type": "stop_measurement"
}
```

#### Get Status
```json
{
  "type": "get_status"
}
```

#### Vital Data Response
```json
{
  "type": "vitals",
  "data": {
    "heart_rate": 72.5,
    "breathing_rate": 16.0,
    "heart_rate_variability": 45.2,
    "stress_level": 0.3,
    "is_measuring": true,
    "timestamp": "2024-04-04 20:12:00",
    "status": "measuring"
  }
}
```

## Frontend Integration

The React frontend connects to this WebSocket server and provides:

1. **Real-time vital signs display**
2. **Health recommendations based on screen time and vitals**
3. **Abnormality detection and alerts**
4. **Screen time tracking**
5. **Health score calculation**

### Key Components

- `VitalMonitor`: Main vital signs display component
- `HealthDashboard`: Comprehensive health overview
- `HealthAlerts`: Floating alert notifications
- `usePresage`: React hook for Presage WebSocket communication
- `useScreenTime`: React hook for screen time tracking

## Architecture

```
┌─────────────────┐    WebSocket     ┌──────────────────┐    Camera     ┌─────────┐
│   React App     │ ◄──────────────► │  C++ Backend     │ ◄────────────► │  User   │
│                 │                  │  (hello_vitals)  │                │         │
│ • Vital Display│                  │                  │                │         │
│ • Health Alerts│                  │ • Presage SDK    │                │         │
│ • Screen Time   │                  │ • WebSocket Server│              │         │
└─────────────────┘                  └──────────────────┘                └─────────┘
```

## Health Monitoring Features

### Vital Signs Tracked
- **Heart Rate (BPM)**: Real-time pulse monitoring
- **Breathing Rate**: Respiratory rate tracking
- **Heart Rate Variability (HRV)**: Autonomic nervous system indicator
- **Stress Level**: Calculated based on HR and HRV

### Health Recommendations
- **20-20-20 Rule**: Eye rest every 20 minutes
- **Break Reminders**: Every 60 minutes of continuous work
- **Posture Checks**: Every 30 minutes
- **Hydration Reminders**: Every 90 minutes
- **Movement Breaks**: Every 2 hours

### Abnormality Detection
- Elevated heart rate (>100 BPM)
- Low heart rate (<50 BPM)
- Rapid breathing (>20 breaths/min)
- High stress levels (>70%)
- Abnormal HRV patterns

## Troubleshooting

### Common Issues

1. **Camera not found**
   - Ensure camera is connected and not in use by other applications
   - Check camera index in settings (default is 0)

2. **API Key errors**
   - Verify API key is valid and properly set
   - Check internet connectivity for cloud-based processing

3. **WebSocket connection failed**
   - Ensure C++ backend is running
   - Check if port 9002 is available
   - Verify firewall settings

4. **Build errors**
   - Ensure all dependencies are installed
   - Check CMake configuration
   - Verify Presage SDK installation

### Debug Mode

Enable verbose logging by uncommenting the debug flags in CMakeLists.txt:

```cmake
set(CMAKE_BUILD_TYPE Debug)
add_definitions(-DDEBUG)
```

## Privacy & Security

- All vital sign processing happens locally (when using edge metrics)
- Camera data is not stored or transmitted
- API key is only used for Presage cloud services when needed
- WebSocket communication is local only (localhost)

## License

This integration follows the same license as the main project. The Presage SDK has its own licensing terms - please refer to the official Presage documentation.
