#include <iostream>
#include <memory>
#include <string>
#include <thread>
#include <chrono>
#include <mutex>
#include <atomic>
#include <functional>

// Presage SmartSpectra SDK
#include <presage/smartspectra/container/settings/settings.h>
#include <presage/smartspectra/container/container.h>

// OpenCV for camera
#include <opencv2/opencv.hpp>

// WebSocket++ for frontend communication
#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

// nlohmann JSON
#include <nlohmann/json.hpp>

using json = nlohmann::json;
using websocket_server = websocketpp::server<websocketpp::config::asio>;

// Global variables for vital data
struct VitalData {
    double heart_rate = 0.0;
    double breathing_rate = 0.0;
    double heart_rate_variability = 0.0;
    double stress_level = 0.0;
    bool is_measuring = false;
    std::string timestamp;
    std::string status = "idle";
};

std::mutex vital_data_mutex;
VitalData current_vitals;
std::atomic<bool> should_stop(false);

// WebSocket server
websocket_server ws_server;
std::thread ws_thread;

// Function to broadcast vital data to all connected clients
void broadcast_vitals() {
    std::lock_guard<std::mutex> lock(vital_data_mutex);
    
    json vital_json = {
        {"type", "vitals"},
        {"data", {
            {"heart_rate", current_vitals.heart_rate},
            {"breathing_rate", current_vitals.breathing_rate},
            {"heart_rate_variability", current_vitals.heart_rate_variability},
            {"stress_level", current_vitals.stress_level},
            {"is_measuring", current_vitals.is_measuring},
            {"timestamp", current_vitals.timestamp},
            {"status", current_vitals.status}
        }}
    };
    
    std::string message = vital_json.dump();
    
    // Broadcast to all connections
    for(auto& hdl : ws_server.get_connections()) {
        try {
            ws_server.send(hdl, message, websocketpp::frame::opcode::text);
        } catch(const websocketpp::lib::error_code& e) {
            std::cerr << "WebSocket send error: " << e.message() << std::endl;
        }
    }
}

// Presage metrics callback
void on_core_metrics_output(const presage::physiology::MetricsBuffer& metrics) {
    std::lock_guard<std::mutex> lock(vital_data_mutex);
    
    // Extract vital signs from metrics
    if (metrics.has_pulse_rate()) {
        current_vitals.heart_rate = metrics.pulse_rate().value();
    }
    
    if (metrics.has_breathing_rate()) {
        current_vitals.breathing_rate = metrics.breathing_rate().value();
    }
    
    if (metrics.has_heart_rate_variability()) {
        current_vitals.heart_rate_variability = metrics.heart_rate_variability().value();
    }
    
    // Calculate stress level (simplified - in real implementation, use proper algorithm)
    if (current_vitals.heart_rate > 0 && current_vitals.heart_rate_variability > 0) {
        // Simple stress calculation based on HR and HRV
        double stress_indicator = (current_vitals.heart_rate - 60) / 40.0; // Normalize around 60 BPM
        double hrv_indicator = (50 - current_vitals.heart_rate_variability) / 50.0; // Lower HRV = higher stress
        current_vitals.stress_level = std::max(0.0, std::min(1.0, (stress_indicator + hrv_indicator) / 2.0));
    }
    
    // Update timestamp
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    current_vitals.timestamp = std::ctime(&time_t);
    current_vitals.timestamp.pop_back(); // Remove newline
    
    current_vitals.is_measuring = true;
    current_vitals.status = "measuring";
    
    // Broadcast to frontend
    broadcast_vitals();
}

// WebSocket message handler
void on_message(websocket_server* server, websocketpp::connection_hdl hdl, websocket_server::message_ptr msg) {
    try {
        json message = json::parse(msg->get_payload());
        std::string type = message["type"];
        
        if (type == "start_measurement") {
            std::cout << "Starting vital measurement..." << std::endl;
            {
                std::lock_guard<std::mutex> lock(vital_data_mutex);
                current_vitals.status = "starting";
            }
            broadcast_vitals();
        }
        else if (type == "stop_measurement") {
            std::cout << "Stopping vital measurement..." << std::endl;
            {
                std::lock_guard<std::mutex> lock(vital_data_mutex);
                current_vitals.is_measuring = false;
                current_vitals.status = "stopped";
            }
            broadcast_vitals();
        }
        else if (type == "get_status") {
            broadcast_vitals();
        }
    }
    catch(const std::exception& e) {
        std::cerr << "WebSocket message error: " << e.what() << std::endl;
    }
}

// WebSocket server thread
void websocket_server_thread() {
    try {
        ws_server.set_access_channels(websocketpp::log::alevel::all);
        ws_server.clear_access_channels(websocketpp::log::alevel::frame_payload);
        
        ws_server.init_asio();
        ws_server.set_message_handler(std::bind(&on_message, &ws_server, std::placeholders::_1, std::placeholders::_2));
        
        ws_server.listen(9002);
        ws_server.start_accept();
        
        std::cout << "WebSocket server started on port 9002" << std::endl;
        ws_server.run();
    }
    catch(const std::exception& e) {
        std::cerr << "WebSocket server error: " << e.what() << std::endl;
    }
}

int main() {
    std::cout << "Starting Presage Vitals Monitoring System..." << std::endl;
    
    // Start WebSocket server
    ws_thread = std::thread(websocket_server_thread);
    
    // Give WebSocket server time to start
    std::this_thread::sleep_for(std::chrono::milliseconds(1000));
    
    try {
        // Initialize Presage settings
        presage::smartspectra::container::settings::Settings settings;
        
        // Set API key (you'll need to get this from https://physiology.presagetech.com)
        settings.set_api_key("YOUR_API_KEY_HERE");
        
        // Enable edge metrics for real-time processing
        settings.set_enable_edge_metrics(true);
        
        // Configure camera settings
        settings.set_camera_index(0); // Default camera
        
        // Initialize Presage container
        presage::smartspectra::container::Container container;
        
        // Set metrics callback
        auto status = container.SetOnCoreMetricsOutput(on_core_metrics_output);
        if (!status.ok()) {
            std::cerr << "Failed to set metrics callback: " << status.message() << std::endl;
            return -1;
        }
        
        // Initialize container
        status = container.Initialize(settings);
        if (!status.ok()) {
            std::cerr << "Failed to initialize container: " << status.message() << std::endl;
            return -1;
        }
        
        std::cout << "Presage container initialized successfully!" << std::endl;
        std::cout << "WebSocket server running on ws://localhost:9002" << std::endl;
        std::cout << "Press Ctrl+C to stop..." << std::endl;
        
        // Main loop
        while (!should_stop) {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
            
            // Update status periodically
            static auto last_update = std::chrono::steady_clock::now();
            auto now = std::chrono::steady_clock::now();
            
            if (std::chrono::duration_cast<std::chrono::seconds>(now - last_update).count() >= 5) {
                if (!current_vitals.is_measuring) {
                    std::lock_guard<std::mutex> lock(vital_data_mutex);
                    current_vitals.status = "ready";
                    broadcast_vitals();
                }
                last_update = now;
            }
        }
        
        // Cleanup
        container.Shutdown();
        
    } catch(const std::exception& e) {
        std::cerr << "Error: " << e.what() << std::endl;
        return -1;
    }
    
    // Stop WebSocket server
    ws_server.stop();
    if (ws_thread.joinable()) {
        ws_thread.join();
    }
    
    std::cout << "Presage Vitals Monitoring System stopped." << std::endl;
    return 0;
}