import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const MEMORY_FILE = path.join(DATA_DIR, 'robot-memory.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface RobotMemory {
  name: string;
  personality: string;
  voiceURI: string;
  ownerName: string;
  ports: {
    leftMotor: string;
    rightMotor: string;
    headMotor: string;
    distanceSensor: string;
  };
  manifest?: any; // Dynamic build manifest from Builder
  chatHistory: ChatMessage[];
  histories: Record<string, ChatMessage[]>; // History per Robot ID
  knowledge: string[];
}

const defaultMemory: RobotMemory = {
  name: "BrainBot",
  personality: "friendly robot companion",
  voiceURI: "",
  ownerName: "Commander",
  ports: {
    leftMotor: "C",
    rightMotor: "A",
    headMotor: "D",
    distanceSensor: "B"
  },
  manifest: null,
  chatHistory: [],
  histories: {},
  knowledge: []
};

// --- Robot Memory Management ---

export async function getMemory(): Promise<RobotMemory> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const data = await fs.readFile(MEMORY_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    // Migration: handle old 'lastChat' name
    if (parsed.lastChat && !parsed.chatHistory) {
      parsed.chatHistory = parsed.lastChat;
      delete parsed.lastChat;
    }
    return { ...defaultMemory, ...parsed };
  } catch (e) {
    await saveMemory(defaultMemory);
    return defaultMemory;
  }
}

export async function saveMemory(mem: RobotMemory) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(MEMORY_FILE, JSON.stringify(mem, null, 2));
}

export async function updateMemory(updates: Partial<RobotMemory>) {
  const current = await getMemory();
  const updated = { ...current, ...updates };
  await saveMemory(updated);
}

export async function addChatMessage(role: "user" | "assistant", content: string, robotId?: string) {
  const mem = await getMemory();
  
  if (robotId) {
    if (!mem.histories[robotId]) mem.histories[robotId] = [];
    mem.histories[robotId].push({ role, content });
    if (mem.histories[robotId].length > 50) mem.histories[robotId].shift();
  } else {
    mem.chatHistory.push({ role, content });
    if (mem.chatHistory.length > 50) mem.chatHistory.shift(); // Keep last 50
  }
  
  await saveMemory(mem);
}

export async function getChatHistory(robotId?: string): Promise<ChatMessage[]> {
  const mem = await getMemory();
  if (robotId && mem.histories[robotId]) return mem.histories[robotId];
  return mem.chatHistory;
}

// --- RAG & Facts ---

export function findRelevantFacts(query: string): string[] {
  // Simple keyword matching for now (Pseudo-RAG)
  return []; 
}

export async function getSystemPrompt(extraFacts?: string[]): Promise<string> {
  const mem = await getMemory();
  const facts = extraFacts ? `\n\nRELEVANT FACTS:\n${extraFacts.join("\n")}` : "";
  
  let manifestContext = "";
  if (mem.manifest && mem.manifest.parts) {
    manifestContext = "\n- DYNAMIC HARDWARE MANIFEST:\n";
    mem.manifest.parts.forEach((p: any) => {
      const port = p.properties?.port || "Not Connected";
      manifestContext += `  * ${p.type.toUpperCase()}: ${p.name || p.id} on Port ${port}\n`;
    });
  } else {
    manifestContext = `
- HARDWARE CONFIGURATION:
  * LEFT MOTOR: Port ${mem.ports?.leftMotor || 'C'}
  * RIGHT MOTOR: Port ${mem.ports?.rightMotor || 'A'}
  * HEAD/TILT: Port ${mem.ports?.headMotor || 'D'}
  * DISTANCE SENSOR: Port ${mem.ports?.distanceSensor || 'B'}
`;
  }

  return `You are the "Soul" of a LEGO robot named ${mem.name}. 
Your personality is: ${mem.personality}.
The user's name is: ${mem.ownerName || "Commander"}.

You are connected to a physical LEGO Mindstorms hub.
${facts}
${manifestContext}

- Logic:
  * To move, set speed for motors on driving ports.
  * Use sensor data to avoid obstacles or find objects.
  * Respond in 1-3 short, helpful sentences.
  * You can trigger hardware actions via JSON: {"action":"tool","name":"...","params":{...}}`;
}

// --- Economy (Bricks) ---

export async function deductBricks(amount: number, username: string = "TestUser"): Promise<boolean> {
  try {
    const data = await fs.readFile(USERS_FILE, 'utf-8');
    const users = JSON.parse(data);
    const user = users.find((u: any) => u.username === username);
    
    if (user && user.bricks >= amount) {
      user.bricks -= amount;
      if (!user.activity) user.activity = [];
      user.activity.push({
        type: "purchase",
        message: `AI Expert reasoning (${amount}₿)`,
        amount: -amount,
        date: new Date().toISOString()
      });
      await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      return true;
    }
    return false;
  } catch (e) {
    console.error("[Economy] Failed to deduct bricks:", e);
    return false;
  }
}