<div align="center">

# 🧠 BrainBricks

### *Turn Any LEGO Robot Into an AI-Powered Companion*

[![Aurora Hackathon](https://img.shields.io/badge/Aurora_Global_Hackathon-Stage_2-gold?style=for-the-badge)](https://devpost.com)
[![Gemini AI](https://img.shields.io/badge/Powered_by-Google_Gemini_AI-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev)
[![LEGO](https://img.shields.io/badge/Hardware-LEGO_Spike_Prime-red?style=for-the-badge)](https://education.lego.com)

<br/>

**Your Phone = Robot Brain** · **LEGO = Robot Body** · **Gemini = Robot Intelligence**

</div>

---

## 🎯 What is BrainBricks?

BrainBricks is an **AI-native operating system** that transforms any LEGO Spike Prime robot into an intelligent, voice-controlled companion. Simply mount your phone onto a LEGO robot — the camera becomes its **eyes**, the microphone becomes its **ears**, the speaker becomes its **voice**, and Google Gemini becomes its **brain**.

### The Problem
Robotics education is held back by a **steep coding barrier**. Programming complex behaviors (computer vision, reasoning, voice interaction) takes months to learn. There's no bridge between affordable toys and cutting-edge AI.

### The Solution
BrainBricks eliminates the "syntax barrier" through **natural language control**. Students interact with their robots through conversation, not code — while the AI handles perception, reasoning, and motor control behind the scenes.

---

## ⚡ Key Features

| Feature | Description |
|---------|-------------|
| 🎤 **Voice Control** | Talk to your robot naturally — native Android STT + TTS |
| 👁️ **AI Vision** | Camera stream analyzed by Gemini for object/obstacle awareness |
| 🔧 **3D Builder** | Visual forge to design and configure robot assemblies |
| ⚡ **Gemini Live** | Real-time bidirectional audio/video streaming via WebSockets |
| 🎮 **Hardware Control** | WebBluetooth direct motor/sensor control for LEGO Spike Prime |
| 🛒 **Marketplace** | Trade AI-generated blueprints, personalities, and MCP tools |
| 💰 **Bricks Economy** | In-app currency system with 20% marketplace commission |

---

## 🏗️ Architecture

```
📱 Phone (Head)              ☁️ Cloud (Brain)             🤖 LEGO (Body)
┌──────────────┐      ┌─────────────────────┐      ┌──────────────┐
│  Camera  👁️  │      │  Gemini 3.1 Flash   │      │  Spike Hub   │
│  Mic     🎤  │◄────►│  Gemini Live Stream │◄────►│  Motors ⚙️   │
│  Speaker 🔊  │  WS  │  Robotics ER 1.6    │  BLE │  Sensors 📡  │
│  React App   │      │  Node.js Backend    │      │  LEGO Parts  │
└──────────────┘      └─────────────────────┘      └──────────────┘
```

### AI Model Stack (Google AI Pro)

| Model | Role | Mode |
|-------|------|------|
| **Gemini 3.1 Flash Lite** | Conversational chat + vision | Standard |
| **Gemini 3 Flash Live** | Real-time audio/video stream | Live API |
| **Gemini Robotics ER 1.6** | Expert reasoning + tool use | Expert |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Android Studio (for APK builds)
- Google AI API Key ([Get one here](https://aistudio.google.com))

### 1. Clone & Install
```bash
git clone https://github.com/Beknurrr-code/BrainBrick.git
cd BrainBrick/prototype_2
npm install
cd client && npm install && cd ..
cd server && npm install && cd ..
```

### 2. Configure
```bash
# Create .env in prototype_2/server/
cp server/.env.example server/.env
# Add your Google AI API key:
# GOOGLE_API_KEY=your_key_here
```

### 3. Run Development
```bash
# Terminal 1 — Backend
cd server && npm run dev

# Terminal 2 — Frontend
cd client && npm run dev
```

### 4. Build Android APK
```bash
cd client
npx vite build
npx cap sync
cd android
./gradlew assembleDebug
# APK → client/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 📁 Project Structure

```
prototype_2/
├── client/                 # React + Capacitor Mobile App
│   ├── src/
│   │   ├── pages/
│   │   │   ├── BuilderPage.tsx    # 3D Builder + Voice Control
│   │   │   ├── PhonePage.tsx      # Gemini Live Streaming
│   │   │   ├── MarketPage.tsx     # AI Marketplace
│   │   │   └── ProfilePage.tsx    # User Dashboard
│   │   ├── hooks/
│   │   │   ├── useSocket.ts       # WebSocket communication
│   │   │   └── useLegoHardware.ts # WebBluetooth LEGO driver
│   │   └── components/
│   └── android/                    # Native Android (Capacitor)
│       └── app/src/.../MainActivity.java  # Native STT + TTS bridges
├── server/                 # Node.js + WebSocket Backend
│   └── src/
│       ├── index.ts               # WebSocket Hub & API Routes
│       └── services/
│           ├── ai.ts              # Gemini AI orchestration
│           ├── live.ts            # Gemini Live BidiStream
│           ├── vision.ts          # Camera frame analysis
│           └── memory.ts          # RAG chat memory
└── shared/                 # Shared TypeScript types
```

---

## 🎯 SDG Alignment

- **SDG 4 — Quality Education**: Low-cost STEM tool deployable in schools worldwide
- **SDG 9 — Innovation & Infrastructure**: Fostering next-gen agentic AI builders

---

## 🏆 Aurora Global Hackathon — Stage 2

**Team**: BrainBricks Founders  
**Member**: Beknur — Lead Developer & Visionary  
**Country**: Kazakhstan 🇰🇿

---

## 📄 License

MIT © 2026 BrainBricks
