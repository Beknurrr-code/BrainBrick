# 🧱 BrainBricks

> **Build the Body. Give a Prompt. Bring it to Life.**

BrainBricks is a web platform that turns any LEGO build into a smart AI-powered robot — using your phone as the brain. Describe what you want in plain English, and AI writes the code to make your robot move, see, speak, and think.

Built for the [Aurora Global Hackathon](https://aurora-global-hackathon-grid.devpost.com/) 🚀

---

## ✨ What it Does

- **🤖 AI Code Generation** — Describe behavior in natural language → AI generates executable robot code
- **📱 Phone as Brain** — Camera = eyes, mic = ears, speaker = voice, sensors = balance
- **🧠 Robot Companion** — Your robot has personality, memory, and learns facts about you
- **🔧 MCP Tools** — 9 extensible tools: movement, vision, speech, sensors, and more
- **🏗️ Template Builder** — 3 ready-made robot templates (Rover, Arm, Pet) + custom builder
- **🎓 Academy** — Learn robot programming with interactive lessons
- **🛒 Marketplace** — Community-built robot templates and MCP tools

---

## 🏗️ Architecture

```
┌─────────────┐     WebSocket      ┌──────────────┐
│  Phone App   │ ◄──────────────► │   Server      │
│  (Camera,    │   real-time       │  (Express +   │
│   Sensors,   │   bidirectional   │   WebSocket)  │
│   Chat)      │                   │               │
└─────────────┘                   │  ┌──────────┐ │
                                  │  │ AI       │ │
┌─────────────┐     WebSocket     │  │ (Open    │ │
│  Dashboard   │ ◄──────────────► │  │  Router) │ │
│  (Motors,    │                   │  └──────────┘ │
│   Controls)  │                   │  ┌──────────┐ │
└─────────────┘                   │  │ MCP      │ │
                                  │  │ Tools    │ │
┌─────────────┐     HTTP/WS       │  └──────────┘ │
│  AI Editor   │ ◄──────────────► │  ┌──────────┐ │
│  (Code Gen)  │                   │  │ Memory   │ │
└─────────────┘                   │  │ (JSON)   │ │
                                  │  └──────────┘ │
┌─────────────┐                   │  ┌──────────┐ │
│  LEGO Bot    │ ◄── Bluetooth ──►│  │ LEGO     │ │
│  (Motors)    │    (optional)     │  │ Service  │ │
└─────────────┘                   │  └──────────┘ │
                                  └──────────────┘
```

---

## 💻 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4 |
| **Backend** | Node.js, Express 5, WebSocket (ws) |
| **AI** | OpenRouter API (Llama 3.3, Qwen3 Coder, Nemotron VL) |
| **Hardware** | LEGO Mindstorms 51515 via `node-poweredup` (BLE) |
| **Phone** | Browser APIs (Camera, Motion, Orientation, Speech) |
| **Storage** | JSON file persistence (robot memory, chat history) |

---

## 🚀 Quick Start

```bash
# Clone the repo
git clone <repo-url>
cd Aurora-Global-Hackathon

# Install all dependencies
npm run install:all

# Set up environment
cp server/.env.example server/.env
# Edit server/.env and add your OpenRouter API key (get one free at openrouter.ai)

# Start development (both client + server)
npm run dev
```

- 🖥️ **Frontend**: http://localhost:5173
- ⚙️ **Backend**: http://localhost:3001
- 📱 **Phone**: Open http://localhost:5173/phone on your mobile browser

---

## 📁 Project Structure

```
brainbricks/
├── client/                    # React frontend (Vite)
│   └── src/
│       ├── pages/            # 8 pages (Home, Builder, Editor, Dashboard, Phone, Academy, Marketplace)
│       ├── components/       # Navbar, UI components
│       └── hooks/            # useSocket (WebSocket hook)
├── server/                    # Node.js backend
│   └── src/
│       ├── index.ts          # Express + WebSocket server (279 lines)
│       ├── services/
│       │   ├── ai.ts         # OpenRouter integration
│       │   ├── memory.ts     # Persistent robot memory (JSON)
│       │   ├── sandbox.ts    # Safe code execution
│       │   ├── lego.ts       # LEGO Mindstorms BLE control
│       │   └── vision.ts     # Image analysis (Nemotron VL)
│       └── mcp/
│           └── server.ts     # 9 MCP tools for robot capabilities
├── content/builds/           # Robot templates (rover, arm, pet)
├── shared/types.ts           # Shared TypeScript interfaces
└── data/                     # Persistent storage (auto-created)
```

---

## 🛠️ MCP Tools

BrainBricks includes 9 built-in MCP tools:

| Tool | Description |
|------|-------------|
| `move_forward(speed)` | Move robot forward |
| `move_backward(speed)` | Move robot backward |
| `turn_left(speed, ms)` | Turn robot left |
| `turn_right(speed, ms)` | Turn robot right |
| `stop()` | Stop all motors |
| `speak(text)` | Text-to-speech through phone |
| `capture_image()` | Take a photo from phone camera |
| `read_sensors()` | Read accelerometer + gyroscope |
| `wait(ms)` | Pause execution |

---

## 🎯 Problem & Solution

**Problem:** Kids aged 10-17 are glued to screens. Physical robots cost $250+ and require complex programming. AI companions are virtual-only.

**Solution:** BrainBricks uses the phone every kid already has as the robot's brain. No expensive hardware. No coding experience needed. Just build, describe, and play.

---

## 📊 Market Opportunity

- **TAM**: $15B STEM education market
- **SAM**: $2B DIY robotics market  
- **SOM**: 50K early adopters in Year 1
- **Target**: Ages 10-17, parents willing to pay $5-10/month

---

## 🏆 Aurora Global Hackathon

This project was built for the Aurora Global Hackathon by ProjectGRID.

- **Stage 1**: Idea & Business Round
- **Stage 2**: Working Prototype (this repo!)
- **Judging Criteria**: Business Merit, Originality, Execution, Presentation

---

## 📝 License

MIT