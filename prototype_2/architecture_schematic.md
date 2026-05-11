# BrainBricks System Architecture Schematic

```mermaid
graph TD
    subgraph Phone ["Smartphone (The Robot Brain)"]
        Camera["📷 Camera"]
        Mic["🎤 Microphone"]
        Speaker["🔊 Speaker"]
        App["BrainBricks App (React/Capacitor)"]
    end

    subgraph Server ["Intelligence Core (Node.js Backend)"]
        WS["WebSocket Hub"]
        Chat["Chat Handler (Flash Lite)"]
        Live["Live Session (Flash Live)"]
        Memory["RAG Memory Service"]
    end

    subgraph Google ["Google AI Cloud"]
        FlashLite["Gemini 3.1 Flash Lite (Chat/Vision)"]
        FlashLive["Gemini 3 Flash Live (Realtime Stream)"]
        ER16["Gemini Robotics ER 1.6 (Expert)"]
    end

    subgraph Hardware ["LEGO Spike Prime"]
        Hub["Spike Hub (BLE)"]
        Motors["Drive Motors"]
        Sensors["Ultrasonic / Color"]
    end

    %% Data Flow
    Camera --> App
    Mic --> App
    App <--> WS
    WS --> Chat --> FlashLite
    WS --> Live <-->|"BidiStream (Audio+Video)"| FlashLive
    Chat --> ER16
    WS <--> Memory

    %% Hardware Loop
    App <-->|"WebBluetooth LWP v3"| Hub
    Hub <--> Motors
    Hub <--> Sensors

    %% Output
    FlashLite --> WS --> App --> Speaker
```

### Workflow:
1. **Perception**: Camera/Mic stream via WebSocket to server
2. **Standard Mode**: Gemini 3.1 Flash Lite for conversational AI + vision analysis  
3. **Live Mode**: Gemini 3 Flash Live for real-time bidirectional audio/video streaming
4. **Expert Handoff**: Complex robotics tasks delegate to Gemini Robotics ER 1.6
5. **Execution**: AI generates motor commands → WebBluetooth → LEGO Hub
