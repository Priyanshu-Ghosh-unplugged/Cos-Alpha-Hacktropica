cmake_minimum_required(VERSION 3.27.0)
project(SmartSpectraHelloVitals CXX)
 
# Set C++ standard
set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)
 
# Find required packages
find_package(SmartSpectra REQUIRED)
find_package(OpenCV REQUIRED)

# Find WebSocket++ for frontend communication
find_package(websocketpp CONFIG REQUIRED)

# Find nlohmann JSON for data serialization
find_package(nlohmann_json CONFIG REQUIRED)
 
# Create executable
add_executable(hello_vitals hello_vitals.cpp)
 
# Link libraries
target_link_libraries(hello_vitals
    SmartSpectra::Container
    SmartSpectra::Gui
    ${OpenCV_LIBS}
    websocketpp::websocketpp
    nlohmann_json::nlohmann_json
)