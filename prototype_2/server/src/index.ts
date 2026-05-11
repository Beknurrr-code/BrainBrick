import express from "express";
import { createServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { monitor } from "./services/monitor.js";
import * as ai from "./services/ai.js";
import { VirtualDriver } from "./services/drivers.js";
import { readDB, writeDB } from "./db.js";
import * as social from "./services/social.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

const simulator = new VirtualDriver();
simulator.connect('LOCAL_SIM_01');

// ─── Simple Rate Limiter (S-Tier Security) ───
const rateLimits = new Map<string, { count: number, lastReset: number }>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 30; // 30 requests per minute

const limiter = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const ip = req.ip || "anonymous";
  const now = Date.now();
  const userLimit = rateLimits.get(ip) || { count: 0, lastReset: now };

  if (now - userLimit.lastReset > RATE_LIMIT_WINDOW) {
    userLimit.count = 0;
    userLimit.lastReset = now;
  }

  userLimit.count++;
  rateLimits.set(ip, userLimit);

  if (userLimit.count > MAX_REQUESTS) {
    return res.status(429).json({ error: "Too many requests. Slow down, Commander." });
  }
  next();
};

app.use("/api/auth", limiter);
app.use("/api/ai", limiter);

// ─── WebSocket Hub ───
const clients = new Map<string, WebSocket>();
const lastFrames = new Map<string, string>();
const liveSessions = new Map<string, GeminiLiveService>();

wss.on("connection", (ws) => {
  const id = Math.random().toString(36).slice(2);
  clients.set(id, ws);
  monitor.setConnections(clients.size);
  console.log(`[WS] Client connected: ${id} (${clients.size} total)`);

  ws.on("message", (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleMessage(id, msg);
    } catch (e: any) {
      console.error("[WS] Invalid message:", e);
    }
  });

  ws.on("close", () => {
    clients.delete(id);
    monitor.setConnections(clients.size);
    const live = liveSessions.get(id);
    if (live) {
      live.disconnect();
      liveSessions.delete(id);
    }
    console.log(`[WS] Client disconnected: ${id} (${clients.size} total)`);
  });
});

// ─── Broadcast Metrics ───
setInterval(() => {
  broadcast({ type: "sys_metrics", payload: monitor.getMetrics() });
}, 2000);

function broadcast(msg: any, exclude?: string) {
  const data = JSON.stringify(msg);
  clients.forEach((ws, id) => {
    if (id !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

// Send a message directly to a specific client (not broadcast)
function sendTo(msg: any, clientId: string) {
  const ws = clients.get(clientId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// ─── Message Router ───
import { handleLegoCommand } from "./services/lego.js";
import { handleAICommand, handleRobotChat, generateMCPTool, handleExpertReasoning } from "./services/ai.js";
import { executeCode, setLastFrame, setLastSensorData } from "./services/sandbox.js";
import { analyzeFrame } from "./services/vision.js";
import { executeTool } from "./mcp/server.js";
import * as memory from "./services/memory.js";
import { authRouter } from "./routes/auth.js";
import { searchGitHub } from "./services/github.js";
import { GeminiLiveService } from "./services/live.js";

async function handleMessage(clientId: string, msg: any) {
  monitor.trackRequest();
  switch (msg.type) {
    case "motor":
    case "motor_angle":
    case "motor_rotate":
    case "acceleration":
      await handleLegoCommand(msg);
      break;
    case "stop":
      await handleLegoCommand({ type: "stop" });
      break;
    case "frame":
      setLastFrame(msg.payload);
      broadcast({ type: "frame", payload: msg.payload }, clientId);
      break;
    case "sensor":
      setLastSensorData(msg.payload);
      broadcast({ type: "sensor", payload: msg.payload }, clientId);
      break;
    case "orientation":
      broadcast({ type: "orientation", payload: msg.payload }, clientId);
      break;
    case "speak":
      broadcast({ type: "speak", payload: msg.payload }, clientId);
      break;
    case "ai_command": {
      const response = await handleAICommand(msg.payload, (m: any) => sendTo(m, clientId), msg.payload?.customConfig);
      sendTo({ type: "ai_response", payload: response }, clientId);
      break;
    }
    case "generate_mcp": {
      const tier = msg.payload?.tier || "standard";
      const tool = await generateMCPTool(msg.payload?.prompt, tier, (m: any) => sendTo(m, clientId), msg.payload?.customConfig);
      sendTo({ type: "mcp_generated", payload: tool }, clientId);
      break;
    }
    case "robot_chat": {
      const tier = msg.payload?.tier || "standard";
      const lastFrame = lastFrames.get(clientId);
      const robotId = msg.payload?.robotId || msg.payload?.robotConfig?.id;

      let envDescription = "";
      if (lastFrame) {
        console.log(`[AI] Analyzing environment for ${clientId}...`);
        const visionResult = await analyzeFrame(lastFrame, "Describe what you see briefly in 1 sentence for the robot's context.");
        envDescription = visionResult.description;
      }

      const robotCtx = msg.payload?.robotConfig || msg.payload?.robotType || "rover";
      // Use sendTo so the ASKING client receives thinking + response (not broadcast which excludes sender)
      const robotReply = await handleRobotChat(msg.payload?.message || "", tier, robotCtx, envDescription, (m: any) => sendTo(m, clientId), msg.payload?.customConfig, robotId);
      sendTo({ type: "robot_chat_response", payload: robotReply }, clientId);
      // Also send speak event so TTS triggers on the client
      if (robotReply.text && !robotReply.error) {
        sendTo({ type: "speak", payload: { text: robotReply.text } }, clientId);
      }
      break;
    }
    case "get_chat_history": {
      const history = await memory.getChatHistory(msg.payload?.robotId);
      broadcast({ type: "chat_history", payload: history }, clientId);
      break;
    }
    case "robot_memory_update":
      await memory.updateMemory(msg.payload || {});
      const updatedMem = await memory.getMemory();
      broadcast({ type: "robot_memory", payload: updatedMem }, clientId);
      break;
    case "run_code":
      const runCtx = msg.payload?.robotConfig || msg.payload?.robotType || "rover";
      const result = await executeCode(msg.payload?.code || "", (m) => broadcast(m, clientId), runCtx);
      broadcast({ type: "execution_result", payload: result }, clientId);
      break;
    case "vision":
      const visionResult = await analyzeFrame(msg.payload?.frame || "", msg.payload?.prompt, (m) => broadcast(m, clientId));
      broadcast({ type: "vision_result", payload: visionResult }, clientId);
      break;

    // ─── Gemini Live Realtime API ───
    case "start_live_session": {
      const apiKey = process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
      if (apiKey) {
        const live = new GeminiLiveService(
          clients.get(clientId)!,
          apiKey,
          (task) => handleExpertHandoff(clientId, task)
        );
        live.connect();
        liveSessions.set(clientId, live);
      }
      break;
    }
    case "live_audio_chunk": {
      const live = liveSessions.get(clientId);
      if (live) live.sendAudio(msg.payload.base64);
      break;
    }
    case "live_video_frame": {
      const live = liveSessions.get(clientId);
      if (live) live.sendFrame(msg.payload.base64);
      break;
    }
    case "trigger_live":
      broadcast({ type: "trigger_live" }, clientId);
      break;
    case "trigger_stop_live":
      broadcast({ type: "trigger_stop_live" }, clientId);
      break;
    case "stop_live_session": {
      const live = liveSessions.get(clientId);
      if (live) {
        live.disconnect();
        liveSessions.delete(clientId);
      }
      break;
    }

    case "mcp_tool":
      const toolCtx = {
        sendMotor: (port: string, speed: number) => handleLegoCommand({ type: "motor", payload: { port, speed } }),
        stopAll: () => handleLegoCommand({ type: "stop" }),
        broadcast: (m: any) => broadcast(m, clientId),
        getLastFrame: () => null,
        getLastSensors: () => null,
      };
      const toolResult = await executeTool(msg.payload?.tool, msg.payload?.params, toolCtx);
      broadcast({ type: "mcp_result", payload: toolResult }, clientId);
      break;
  }
}

async function handleExpertHandoff(clientId: string, task: string) {
  console.log(`[Expert Handoff] Client ${clientId} requested expert for: ${task}`);

  // 1. Notify client to show UI transition
  broadcast({ type: "expert_handoff", payload: { task } }, clientId);

  // 2. Stop live session (temporarily)
  const live = liveSessions.get(clientId);
  if (live) {
    live.disconnect();
    liveSessions.delete(clientId);
  }

  // 3. Get last frame
  const lastFrame = lastFrames.get(clientId) || "";

  // 4. Run Expert Reasoning
  try {
    const robotCtx = "rover"; // Default for handoff, but could be dynamic
    const response = await ai.handleExpertReasoning(task, lastFrame, "standard", "rover", (m: any) => broadcast(m, clientId));

    // 5. Execute generated code
    if (response.code) {
      broadcast({ type: "ai_response", payload: response }, clientId);
      const executionResult = await executeCode(response.code, (m: any) => broadcast(m, clientId), "rover");
      broadcast({ type: "execution_result", payload: executionResult }, clientId);
    }

    // 6. Optionally restart live session or stay in dashboard
    broadcast({ type: "speak", payload: { text: "Миссия завершена. Я готов к новым задачам!" } });

  } catch (e) {
    console.error("[Expert Handoff] Error:", e);
    broadcast({ type: "speak", payload: { text: "Произошла ошибка при работе экспертного мозга." } });
  }
}

// ─── REST API ───
app.use("/api/auth", authRouter);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", clients: clients.size });
});

app.get("/api/builds", (_req, res) => {
  try {
    const buildsDir = path.join(__dirname, "..", "..", "content", "builds");
    const files = fs.readdirSync(buildsDir).filter((f) => f.endsWith(".json"));
    const builds = files.map((f) => {
      const raw = fs.readFileSync(path.join(buildsDir, f), "utf-8");
      return JSON.parse(raw);
    });
    res.json(builds);
  } catch {
    res.json([]);
  }
});

app.get("/api/builds/:id", (req, res) => {
  try {
    const buildsDir = path.join(__dirname, "..", "..", "content", "builds");
    const filePath = path.join(buildsDir, `${req.params.id}.json`);
    if (!fs.existsSync(filePath)) {
      res.status(404).json({ error: "Build not found" });
      return;
    }
    const raw = fs.readFileSync(filePath, "utf-8");
    res.json(JSON.parse(raw));
  } catch {
    res.status(500).json({ error: "Failed to read build" });
  }
});

app.post("/api/builds", (req, res) => {
  try {
    const build = req.body;
    if (!build.id) {
      res.status(400).json({ error: "Missing build ID" });
      return;
    }
    const buildsDir = path.join(__dirname, "..", "..", "content", "builds");
    if (!fs.existsSync(buildsDir)) fs.mkdirSync(buildsDir, { recursive: true });

    fs.writeFileSync(path.join(buildsDir, `${build.id}.json`), JSON.stringify(build, null, 2));
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: "Failed to save build" });
  }
});

app.post("/api/ai/generate", async (req, res) => {
  const { prompt, type, options } = req.body;
  try {
    const artifact = await ai.neuralForge(type, prompt, options || {});
    res.json({ success: true, artifact });
  } catch (e: any) {
    res.status(500).json({ success: false, error: e.message });
  }
});

// ─── Marketplace Engagement API ───
const marketplacePath = path.join(__dirname, "../../data/marketplace.json");
const marketplaceStatsPath = path.join(__dirname, "../../data/marketplace_stats.json");
const messagesPath = path.join(__dirname, "../../data/messages.json");
const usersPath = path.join(__dirname, "../../data/users.json");

const getMarketStats = () => {
  if (!fs.existsSync(marketplaceStatsPath)) return { likes: {}, downloads: {} };
  try {
    return JSON.parse(fs.readFileSync(marketplaceStatsPath, "utf-8"));
  } catch (e) {
    return { likes: {}, downloads: {} };
  }
};

app.get("/api/marketplace/stats", (req, res) => {
  res.json(getMarketStats());
});

app.post("/api/marketplace/like", (req, res) => {
  const { id } = req.body;
  const data = getMarketStats();
  data.likes[id] = (data.likes[id] || 0) + 1;
  fs.writeFileSync(marketplaceStatsPath, JSON.stringify(data, null, 2));
  res.json({ success: true, count: data.likes[id] });
});

app.post("/api/marketplace/download", (req, res) => {
  const { id } = req.body;
  const data = getMarketStats();
  data.downloads[id] = (data.downloads[id] || 0) + 1;
  fs.writeFileSync(marketplaceStatsPath, JSON.stringify(data, null, 2));
  res.json({ success: true, count: data.downloads[id] });
});

// ─── Robot Memory API ───
app.get("/api/memory", async (_req, res) => {
  res.json(await memory.getMemory());
});

app.post("/api/memory", async (req, res) => {
  await memory.updateMemory(req.body);
  res.json(await memory.getMemory());
});

app.get("/api/memory/chat", async (_req, res) => {
  const mem = await memory.getMemory();
  res.json(mem.chatHistory);
});

app.post("/api/memory/chat", async (req, res) => {
  const { role, content } = req.body;
  await memory.addChatMessage(role, content);
  res.json({ ok: true });
});

// ─── User Profile & Economy API ───
if (!fs.existsSync(path.dirname(marketplacePath))) fs.mkdirSync(path.dirname(marketplacePath), { recursive: true });

const INITIAL_MARKET_ITEMS = [
  { id: "1", name: "Rover Bot Pro", description: "Enhanced rover with line following. Compatible with LEGO 51515.", author: "BrainBricks Team", type: "builds", chassis: "lego", likes: 142, downloads: 89, tags: ["rover", "camera"], rating: 4.8, date: "2026-04-20" },
  { id: "2", name: "Arduino Arm", description: "3-axis arm for ESP32/Arduino. High precision sorting.", author: "RoboMaster_42", type: "builds", chassis: "arduino", likes: 98, downloads: 56, tags: ["arm", "esp32"], rating: 4.6, date: "2026-04-21" },
  { id: "3", name: "Cardboard Pet", description: "The most affordable robot. Just cardboard and your phone!", author: "BuilderKid", type: "builds", chassis: "diy", likes: 215, downloads: 134, tags: ["pet", "low-cost"], rating: 4.9, date: "2026-04-22" },
  { id: "8", name: "Weather MCP", description: "Real-time weather data for any robot brain.", author: "BrainBricks Team", type: "mcp_tools", chassis: "universal", likes: 88, downloads: 67, tags: ["weather", "api"], rating: 4.4, date: "2026-04-19" },
];

if (!fs.existsSync(marketplacePath)) {
  fs.writeFileSync(marketplacePath, JSON.stringify(INITIAL_MARKET_ITEMS, null, 2));
}

const getUsers = () => {
  if (!fs.existsSync(usersPath)) return [];
  try {
    return JSON.parse(fs.readFileSync(usersPath, "utf-8"));
  } catch (e) {
    return [];
  }
};

const verifyAdmin = (req: any, res: any, next: any) => {
  // Access control disabled for Hackathon Demo
  next();
};

const getMarketItems = () => {
  if (!fs.existsSync(marketplacePath)) return INITIAL_MARKET_ITEMS;
  try {
    return JSON.parse(fs.readFileSync(marketplacePath, "utf-8"));
  } catch (e) {
    return INITIAL_MARKET_ITEMS;
  }
};

const getCurrentUser = (req: express.Request) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return null;
  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [username] = decoded.split(":");
    const users = getUsers();
    return users.find((u: any) => u.username === username) || null;
  } catch {
    return null;
  }
};

app.get("/api/user/profile", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) {
    // Fallback for legacy compatibility if no token provided
    const users = getUsers();
    let testUser = users.find((u: any) => u.username === "TestUser");
    if (!testUser) {
      testUser = { username: "TestUser", bricks: 1000, inventory: ["1", "8"], activity: [], settings: { aiTier: "pro" } };
      users.push(testUser);
      fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    }
    return res.json(testUser);
  }
  res.json(user);
});

app.post("/api/user/withdraw", (req, res) => {
  const { amount: requestedAmount } = req.body;
  const authUser = getCurrentUser(req);
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === (authUser?.username || "TestUser"));
  if (userIdx === -1) return res.status(404).json({ success: false, message: "User not found" });

  const currentBalance = users[userIdx].bricks || 0;
  const amountToWithdraw = requestedAmount || currentBalance;

  if (amountToWithdraw < 100) return res.status(400).json({ success: false, message: "Min withdrawal is 100₿" });
  if (amountToWithdraw > currentBalance) return res.status(400).json({ success: false, message: "Insufficient balance" });

  users[userIdx].bricks -= amountToWithdraw;
  if (!users[userIdx].activity) users[userIdx].activity = [];
  users[userIdx].activity.unshift({
    type: "withdrawal",
    message: `Withdrew ${amountToWithdraw}₿ to SOL wallet`,
    amount: -amountToWithdraw,
    date: new Date().toISOString()
  });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, newBalance: users[userIdx].bricks });
});

app.post("/api/marketplace/purchase", (req, res) => {
  const { itemId } = req.body;
  const items = getMarketItems();
  const item = items.find((i: any) => i.id === itemId);
  if (!item) return res.status(404).json({ success: false, message: "Item not found" });

  const price = item.price || 0;
  const authUser = getCurrentUser(req);
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === (authUser?.username || "TestUser"));

  if (userIdx === -1) return res.status(404).json({ success: false, message: "User not found" });
  if (users[userIdx].bricks < price) return res.status(400).json({ success: false, message: "Not enough Bricks" });

  users[userIdx].bricks -= price;

  // Implement 20% Platform Commission
  const commission = Math.floor(price * 0.2);
  const payout = price - commission;

  // Find and credit the author
  const authorIdx = users.findIndex((u: any) => u.username === item.author);
  if (authorIdx !== -1) {
    users[authorIdx].bricks = (users[authorIdx].bricks || 0) + payout;
    if (!users[authorIdx].activity) users[authorIdx].activity = [];
    users[authorIdx].activity.unshift({
      type: "sale",
      message: `Sold ${item.name} (-20% platform fee)`,
      amount: payout,
      date: new Date().toISOString()
    });
  }

  if (!users[userIdx].inventory.includes(itemId)) {
    users[userIdx].inventory.push(itemId);
  }

  if (!users[userIdx].activity) users[userIdx].activity = [];
  users[userIdx].activity.unshift({
    type: "purchase",
    message: `Purchased ${item.name}`,
    amount: -price,
    date: new Date().toISOString()
  });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, newBalance: users[userIdx].bricks, commissionTaken: commission });
});

app.get("/api/marketplace/items", (_req, res) => {
  res.json(getMarketItems());
});

app.post("/api/marketplace/upload", (req, res) => {
  const newItem = req.body;
  const items = getMarketItems();

  const uploadItem = {
    ...newItem,
    price: newItem.price || 0, // Set dynamic price
    likes: 0,
    downloads: 0,
    rating: 5.0,
    date: new Date().toISOString().split('T')[0]
  };

  items.unshift(uploadItem);
  fs.writeFileSync(marketplacePath, JSON.stringify(items, null, 2));
  res.json({ success: true });
});

// ─── Social Sphere API ───
app.get("/api/social/messages", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));
    const userMsgs = messages.filter((m: any) => m.from === user.username || m.to === user.username);
    res.json(userMsgs);
  } catch (e) {
    res.json([]);
  }
});

app.post("/api/social/send", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  
  const { to, text } = req.body;
  if (!to || !text) return res.status(400).json({ error: "Recipient and text required" });

  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));
    const newMsg = {
      id: Date.now().toString(),
      from: user.username,
      to,
      text,
      timestamp: new Date().toISOString()
    };
    messages.push(newMsg);
    fs.writeFileSync(messagesPath, JSON.stringify(messages, null, 2));
    res.json({ success: true, message: newMsg });
  } catch (e) {
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.get("/api/social/contacts", (req, res) => {
  const user = getCurrentUser(req);
  if (!user) return res.status(401).json({ error: "Unauthorized" });

  try {
    const messages = JSON.parse(fs.readFileSync(messagesPath, "utf-8"));
    const contacts = new Set<string>();
    messages.forEach((m: any) => {
      if (m.from === user.username) contacts.add(m.to);
      if (m.to === user.username) contacts.add(m.from);
    });
    
    const users = getUsers();
    const contactProfiles = Array.from(contacts).map(c => {
      const u = users.find((usr: any) => usr.username === c);
      return {
        username: c,
        avatar: u?.avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${c}`,
        bio: u?.bio || "BrainBricks Pilot"
      };
    });
    res.json(contactProfiles);
  } catch (e) {
    res.json([]);
  }
});

// ─── Admin Control API ───
app.get("/api/admin/users", verifyAdmin, (_req, res) => {
  res.json(getUsers());
});

app.get('/api/admin/financials', verifyAdmin, (_req, res) => {
  const users = getUsers();
  const items = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'data', 'marketplace.json'), 'utf8'));
  
  const totalEconomy = users.reduce((acc: any, u: any) => acc + (u.bricks || 0), 0);
  const platformProfit = Math.floor(totalEconomy * 0.2);
  
  res.json({
    totalEconomy,
    platformProfit,
    activeArtifacts: items.length,
    transactionVolume: items.reduce((acc: any, i: any) => acc + (i.downloads || 0), 0) * 100
  });
});

app.post("/api/admin/update-balance", verifyAdmin, (req, res) => {
  const { username, amount } = req.body;
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === username);

  if (userIdx === -1) return res.status(404).json({ error: "User not found" });

  users[userIdx].bricks = (users[userIdx].bricks || 0) + amount;
  if (users[userIdx].bricks < 0) users[userIdx].bricks = 0;

  if (!users[userIdx].activity) users[userIdx].activity = [];
  users[userIdx].activity.unshift({
    type: "system",
    message: `Admin adjusted balance by ${amount}₿`,
    amount: amount,
    date: new Date().toISOString()
  });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, newBalance: users[userIdx].bricks });
});

app.post("/api/bricks/reward", (req, res) => {
  const { amount } = req.body;
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === "TestUser");
  if (userIdx !== -1) {
    users[userIdx].bricks += amount;
    if (!users[userIdx].activity) users[userIdx].activity = [];
    users[userIdx].activity.unshift({
      type: "gift",
      message: `Received reward: ${amount}₿`,
      amount: amount,
      date: new Date().toISOString()
    });
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  }
  res.json({ success: true });
});

// ─── Robot Chat Handler removed — using services/ai.ts

app.get("/api/marketplace/github", async (req, res) => {
  const query = (req.query.q as string) || "";
  const results = await searchGitHub(query);
  res.json(results);
});

app.get("/api/weather", async (req, res) => {
  const city = (req.query.city as string) || "Astana";
  try {
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=demo&units=metric`
    );
    if (!weatherRes.ok) throw new Error("API error");
    const data = await weatherRes.json();
    res.json(data);
  } catch {
    // Fallback when no real API key
    res.json({
      city,
      temp: Math.round(Math.random() * 30 - 5),
      description: ["sunny", "cloudy", "partly cloudy", "windy"][Math.floor(Math.random() * 4)],
      humidity: Math.round(40 + Math.random() * 40),
      note: "Demo data — add OpenWeatherMap API key for real weather",
    });
  }
});


// ─── Admin APIs ───
app.get("/api/admin/users", verifyAdmin, (req, res) => {
  const users = getUsers();
  res.json(users);
});

app.post("/api/admin/update-balance", verifyAdmin, (req, res) => {
  const { username, amount } = req.body;
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === username);
  if (userIdx !== -1) {
    users[userIdx].bricks += amount;
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

app.post("/api/admin/update-settings", verifyAdmin, (req, res) => {
  const { username, settings } = req.body;
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === username);
  if (userIdx !== -1) {
    users[userIdx].settings = { ...(users[userIdx].settings || {}), ...settings };
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
    res.json({ success: true });
  } else {
    res.status(404).json({ success: false });
  }
});

app.post("/api/user/upgrade", (req, res) => {
  const { tier } = req.body;
  if (tier !== "pro") return res.status(400).json({ success: false, message: "Invalid tier" });

  const price = 1900; // $19 = 1900 Bricks
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === "TestUser");

  if (userIdx === -1) return res.status(404).json({ success: false, message: "User not found" });
  if (users[userIdx].settings?.aiTier === "pro") return res.status(400).json({ success: false, message: "Already upgraded" });
  if (users[userIdx].bricks < price) return res.status(400).json({ success: false, message: "Insufficient Bricks (Need 1900₿)" });

  users[userIdx].bricks -= price;
  if (!users[userIdx].settings) users[userIdx].settings = { aiTier: "pro", voiceURI: "" };
  else users[userIdx].settings.aiTier = "pro";

  if (!users[userIdx].activity) users[userIdx].activity = [];
  users[userIdx].activity.unshift({
    type: "purchase",
    message: "Upgraded to Neural Nexus (Pro Tier)",
    amount: -price,
    date: new Date().toISOString()
  });

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  res.json({ success: true, newBalance: users[userIdx].bricks, newTier: "pro" });
});

app.post("/api/user/settings", (req, res) => {
  const { aiTier, voiceURI } = req.body;
  const authUser = getCurrentUser(req);
  const users = getUsers();
  const userIdx = users.findIndex((u: any) => u.username === (authUser?.username || "TestUser"));
  if (userIdx !== -1) {
    if (aiTier !== undefined) users[userIdx].aiTier = aiTier;
    if (voiceURI !== undefined) {
      if (!users[userIdx].settings) users[userIdx].settings = { aiTier: "standard", voiceURI: "" };
      users[userIdx].settings.voiceURI = voiceURI;
    }
    fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
  }
  res.json({ success: true });
});

// AI Reasoning Loop (Cortex-Link)
app.post('/api/ai/reason', async (req, res) => {
  try {
    const { manifest, userCommand, imageDelta } = req.body;
    const result = await ai.processExpertReasoning(manifest, userCommand, imageDelta);
    
    if (result.commands) {
      for (const cmd of result.commands) {
        await simulator.sendCommand({
          port: cmd.args.port,
          action: cmd.functionName.includes('Speed') ? 'SPEED' : 'POSITION',
          value: cmd.args.speed ?? cmd.args.angle ?? 0
        });
      }
    }

    const history = await readDB('history.json');
    history.push({
      timestamp: new Date().toISOString(),
      buildId: manifest.id,
      userCommand,
      thought: result.thought,
      commands: result.commands
    });
    await writeDB('history.json', history);

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/builds', async (req, res) => {
  const builds = await readDB('builds.json');
  res.json(builds);
});

app.post('/api/builds/:id', async (req, res) => {
  const { id } = req.params;
  const builds = await readDB('builds.json');
  const index = builds.findIndex((b: any) => b.id === id);
  if (index !== -1) {
    builds[index] = { ...builds[index], ...req.body };
  } else {
    builds.push(req.body);
  }
  await writeDB('builds.json', builds);
  res.json({ success: true, build: req.body });
});

// Social Hub Endpoints
app.get('/api/social/feed', async (req, res) => {
  const feed = await social.getFeed();
  res.json(feed);
});

app.post('/api/social/share', async (req, res) => {
  const { name, parts } = req.body;
  const user = "TestUser"; // Should come from auth context in real app
  await social.addFeedEvent(user, "published a new build", name);
  res.json({ success: true });
});

app.get('/api/social/contacts', async (req, res) => {
  const user = "TestUser"; // Should come from auth
  const contacts = await social.getContacts(user);
  res.json(contacts);
});

app.get('/api/social/messages', async (req, res) => {
  const user = "TestUser";
  const { with: target } = req.query;
  if (target) {
    const messages = await social.getMessages(user, target as string);
    return res.json(messages);
  }
  // If no target, return all messages for current user (simple implementation)
  const all = await readDB('messages.json');
  res.json(all.filter((m: any) => m.from === user || m.to === user));
});

app.post('/api/social/send', async (req, res) => {
  const from = "TestUser";
  const { to, text } = req.body;
  const msg = await social.sendMessage(from, to, text);
  res.json(msg);
});

// ─── Start ───
const PORT = Number(process.env.PORT) || 3001;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`[BrainBricks] Server running on http://0.0.0.0:${PORT} (Accessible via Network IP)`);
});
