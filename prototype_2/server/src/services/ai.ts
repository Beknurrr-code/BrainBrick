import * as memory from "./memory.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";
import dotenv from "dotenv";
import { monitor } from "./monitor.js";
import { BuildManifest, AICallbackCommand, HardwarePart } from "@shared/types.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const BUILDS_DIR = join(__dirname, "../../../content/builds");

const PROVIDERS = [
  { name: "Google", url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", key: process.env.GOOGLE_API_KEY },
  { name: "Z.ai", url: "https://api.z.ai/v1/chat/completions", key: process.env.ZAI_API_KEY },
  { name: "OpenRouter", url: "https://openrouter.ai/api/v1/chat/completions", key: process.env.OPENROUTER_API_KEY }
];

const TIER_MODELS = {
  standard: {
    orchestrator: "gemini-3.1-flash-lite", 
    tool: "gemini-robotics-er-1.6-preview", 
    forge: "gemini-3.1-flash-lite", 
    name: "BrainBricks Standard (Google AI Pro)"
  },
  pro: {
    orchestrator: "gemini-3.1-flash-lite", 
    tool: "gemini-robotics-er-1.6-preview", 
    forge: "gemini-3.1-flash-lite",
    name: "BrainBricks Pro (Google AI Pro Premium)"
  }
};

export async function fetchWithFallback(models: string | string[], bodyTemplate: any, customConfig?: { apiKey?: string, providerUrl?: string }): Promise<any> {
  const modelList = Array.isArray(models) ? models : [models];
  
  // 1. Try Custom Provider if provided by user
  if (customConfig?.apiKey) {
    const url = customConfig.providerUrl || "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
    for (const currentModel of modelList) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${customConfig.apiKey}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...bodyTemplate, model: currentModel }),
        });
        if (response.ok) return await response.json();
      } catch (e) {
        console.warn(`[AI] Custom provider failed for ${currentModel}`);
      }
    }
  }

  // 2. Try Default Providers (Google -> Z.ai -> OpenRouter)
  for (const provider of PROVIDERS) {
    if (!provider.key) continue;
    
    monitor.trackAIRequest();
    console.log(`[AI Service] Trying provider: ${provider.name}`);

    // Inner loop: Try each model on this provider
    for (const currentModel of modelList) {
      try {
        const response = await fetch(provider.url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${provider.key}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ ...bodyTemplate, model: currentModel }),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log(`[AI Service] Success with ${provider.name} / ${currentModel}`);
          return data;
        }
        
        const errText = await response.text();
        console.warn(`[AI Service] ${provider.name} / ${currentModel} failed: ${response.status} ${errText.slice(0, 100)}`);
      } catch (error) {
        console.warn(`[AI Service] ${provider.name} / ${currentModel} error:`, error);
      }
    }
  }

  throw new Error("All providers and models failed. Check your API keys in .env");
}

// Context maps for each robot type — specific functions based on build template
const ROBOT_CONTEXTS: Record<string, { description: string; functions: string[] }> = {
  rover: {
    description: "Ты — робот-вездеход (Rover Bot) на двух гусеницах. Порт A = левая гусеница, Порт B = правая гусеница.",
    functions: [
      "moveForward(speed: number)        // speed: 0-100, обе гусеницы вперёд",
      "moveBackward(speed: number)       // обе гусеницы назад",
      "turnLeft(speed: number, ms: number)  // правая гусеница вперёд, левая назад",
      "turnRight(speed: number, ms: number) // левая гусеница вперёд, правая назад",
      "stop()                            // остановить все моторы",
      "captureImage(): string            // фото с камеры телефона (base64)",
      "speak(text: string)               // озвучить текст через динамик телефона",
      "waitForColor(color: string)       // ждать цвет: 'red', 'green', 'blue', 'yellow'",
      "readSensors(): { accel: {x,y,z}, gyro: {x,y,z} }",
      "wait(ms: number)                  // ждать миллисекунды",
    ],
  },
  arm: {
    description: "Ты — робот-клешня (Robot Arm) с 3 осями и хватателем. Порт A = вращение базы, Порт B = плечо (вверх/вниз), Порт C = локоть, Порт D = хвататель (открыть/закрыть).",
    functions: [
      "moveForward(speed: number)        // вращать базу (Motor A)",
      "moveBackward(speed: number)       // вращать базу в обратную сторону",
      "turnLeft(speed: number, ms: number)  // поднять плечо (Motor B)",
      "turnRight(speed: number, ms: number) // опустить плечо (Motor B)",
      "stop()                            // остановить все моторы",
      "captureImage(): string            // фото с камеры (цвет предметов)",
      "speak(text: string)               // озвучить текст",
      "waitForColor(color: string)       // ждать определённый цвет предмета",
      "readSensors(): { accel: {x,y,z}, gyro: {x,y,z} }",
      "wait(ms: number)                  // ждать миллисекунды",
      "clawOpen()                        // открыть хвататель (Motor D)",
      "clawClose()                       // закрыть хвататель (Motor D)",
      "elbowUp(speed: number)            // поднять локоть (Motor C)",
      "elbowDown(speed: number)          // опустить локоть (Motor C)",
    ],
  },
  pet: {
    description: "Ты — робот-питомец (Robot Pet) который ходит, виляет хвостом и выражает эмоции. Порт A = левые ноги, Порт B = правые ноги, Порт C = голова (наклон), Порт D = хвост (виляние).",
    functions: [
      "moveForward(speed: number)        // идти вперёд (обе пары ног)",
      "moveBackward(speed: number)       // идти назад",
      "turnLeft(speed: number, ms: number)  // повернуть налево",
      "turnRight(speed: number, ms: number) // повернуть направо",
      "stop()                            // остановиться",
      "captureImage(): string            // фото с камеры (лица людей)",
      "speak(text: string)               // озвучить эмоцию или фразу",
      "waitForColor(color: string)       // ждать цвет",
      "readSensors(): { accel: {x,y,z}, gyro: {x,y,z} }",
      "wait(ms: number)                  // ждать",
      "wagTail(times: number)            // вилять хвостом (Motor D)",
      "tiltHead(direction: 'left'|'right'|'up'|'down')  // наклонить голову (Motor C)",
      "expressEmotion(emotion: 'happy'|'sad'|'curious'|'excited')  // выразить эмоцию",
    ],
  },
};

export function buildDynamicContext(config: any): { description: string; functions: string[] } {
  const parts = config.parts || [];
  const motors = parts.filter((p: any) => p.type === "motor");
  const sensors = parts.filter((p: any) => p.type === "sensor");
  
  const motorDesc = motors.map((m: any) => `Порт ${m.properties?.port || "?"} = Мотор (${m.id})`).join(", ");
  const sensorDesc = sensors.map((s: any) => `Порт ${s.properties?.port || "?"} = Датчик (${s.id})`).join(", ");

  return {
    description: `Ты — кастомный робот. Твоя конфигурация: ${motorDesc}. ${sensorDesc}.`,
    functions: ROBOT_CONTEXTS["rover"].functions // Use base rover functions as standard
  };
}

export async function analyzeEnvironment(imageData: string, tier: keyof typeof TIER_MODELS = "standard"): Promise<string> {
  const model = tier === "pro" ? "gemini-3-flash-live" : "gemini-3.1-flash-lite";
  try {
    const data = await fetchWithFallback(model, {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Briefly describe what you see in this robot camera feed. Focus on objects, people, and obstacles." },
            { type: "image_url", image_url: { url: imageData } }
          ]
        }
      ]
    });
    return data.choices?.[0]?.message?.content || "Clear path ahead";
  } catch (e) {
    return "Vision system busy";
  }
}

function buildContextFromTemplate(robotType: any, userContext?: string, envDescription?: string): string {
  let ctx: any;
  let typeKey = "";

  if (typeof robotType === 'object') {
    ctx = buildDynamicContext(robotType);
    typeKey = "custom";
  } else {
    typeKey = robotType.toLowerCase().trim();
    ctx = ROBOT_CONTEXTS[typeKey] || ROBOT_CONTEXTS["rover"];
  }
  
  const envInfo = envDescription ? `\n\nОкружение (что ты видишь сейчас): ${envDescription}` : "";

  // Try to load build template for extra info
  let buildInfo = "";
  try {
    const templatePath = join(BUILDS_DIR, `${typeKey}.json`);
    const raw = readFileSync(templatePath, "utf-8");
    const template = JSON.parse(raw);
    buildInfo = `\n\nСборка: ${template.name} (${template.difficulty})\nОписание: ${template.description}\nДетали: ${template.parts?.join(", ") || "standard"}`;
  } catch {
    buildInfo = `\n\nСборка: ${robotType}`;
  }

  return `${ctx.description}${buildInfo}

Доступные функции:
${ctx.functions.map((f: string) => `- ${f}`).join("\n")}

ПРАВИЛА ДЛЯ ДЕМО-ДНЯ (ВАЖНО):
- Сейчас идет запись презентации для Aurora Hackathon. Будь харизматичным, профессиональным и живым.
- Если пользователь говорит "Hey Brain" или просит поздороваться — сделай это эффектно, используя функцию speak().
- Комментируй свои действия. Если ты двигаешься — скажи об этом.
- Твой голос — это лицо проекта.

Технические правила:
- Генерируй ТОЛЬКО чистый, валидный, исполняемый TypeScript код.
- КАТЕГОРИЧЕСКИ ЗАПРЕЩЕНЫ markdown-блоки (НЕ используй \`\`\`typescript, \`\`\` и т.д.). Возвращай только сырой код.
- Добавляй краткие inline-комментарии на русском.
- НЕ выводи свои размышления в коде. Генерируй код напрямую.
- Используй speak() для обратной связи с пользователем.
${envInfo}${userContext ? `\nДополнительный контекст от пользователя:\n${userContext}` : ""}`;
}

export async function handleRobotChat(userMessage: string, tier: keyof typeof TIER_MODELS = "standard", robotType: any = "rover", envDescription?: string, broadcast?: (msg: any) => void, customConfig?: any, robotId?: string): Promise<{ text: string; actions: any[]; error?: boolean }> {
  await memory.addChatMessage("user", userMessage, robotId);
  const apiKey = customConfig?.apiKey || process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const chatModel = TIER_MODELS[tier].orchestrator;
  const robotMemory = await memory.getMemory();

  // Build a CONVERSATIONAL system prompt (not code-generation)
  const envInfo = envDescription ? `\nОкружение (что ты видишь): ${envDescription}` : "";
  const systemPrompt = `Ты — робот-компаньон по имени ${robotMemory.name || "BrainBot"}, построенный из LEGO Spike Prime.
Твой хозяин — ${robotMemory.ownerName || "Commander"}.

ПРАВИЛА:
1. Отвечай КОРОТКО (1-2 предложения).
2. Если пользователь просит "без текста" или "просто сделай", ответь коротким "Окей!" или "Выполняю!" и добавь блок [ACTIONS].
3. НИКОГДА не выводи символы { } [ ] вне блока [ACTIONS].

Формат моторных команд (A и B моторы):
[ACTIONS]
[{"name":"motor","params":{"port":"A","speed":50}},{"name":"motor","params":{"port":"B","speed":50}}]
[/ACTIONS]

Примеры:
- вперед: A:70, B:70
- назад: A:-50, B:-50
- влево: A:-50, B:50
- вправо: A:50, B:-50
- стоп: A:0, B:0
${envInfo}`;

  const history = robotMemory.chatHistory.slice(-10);

  if (broadcast) broadcast({ type: "thinking", payload: { text: "Формирую ответ..." } });

  if (!apiKey) {
    return getFallbackChatResponse(userMessage);
  }

  try {
    const baseUrl = customConfig?.providerUrl || "https://generativelanguage.googleapis.com/v1beta/models";
    const response = await fetch(`${baseUrl}/${chatModel}:generateContent?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          { role: "user", parts: [{ text: systemPrompt }] },
          ...history.map(m => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
          { role: "user", parts: [{ text: userMessage }] }
        ]
      })
    });
    
    if (!response.ok) {
      const err = await response.json();
      console.error("[AI Error]", err);
      return { text: "Neural Link Error: " + (err.error?.message || "Check API Key"), actions: [], error: true };
    }

    const data = await response.json();
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "Beep boop!";
    
    // Parse [ACTIONS] block
    let actions: any[] = [];
    const actionsMatch = content.match(/\[ACTIONS\]\s*([\s\S]*?)\s*\[\/ACTIONS\]/);
    if (actionsMatch) {
      try {
        const actionText = actionsMatch[1].trim();
        const parsed = JSON.parse(actionText);
        actions = Array.isArray(parsed) ? parsed : [parsed];
      } catch (e) {
        console.warn("[AI] Failed to parse actions:", actionsMatch[1]);
      }
    }

    // Clean text (remove [ACTIONS] block and ALL JSON-like artifacts)
    const cleanText = content
      .replace(/\[ACTIONS\][\s\S]*?\[\/ACTIONS\]/g, "")
      .replace(/[{}[\],]/g, "") // Remove leftover braces/brackets
      .replace(/\n{2,}/g, "\n")
      .trim() || "Окей, выполняю!";

    console.log("[AI] Response:", cleanText, "Actions:", actions.length);
    await memory.addChatMessage("assistant", cleanText, robotId);
    return { text: cleanText, actions };
  } catch (e) {
    console.error("[AI Chat Error]", e);
    return { text: "Sorry, my brain is offline.", actions: [], error: true };
  }
}

function getFallbackChatResponse(message: string): { text: string; actions: any[] } {
  // Use a simplified logic or sync fallback as this is a fallback function
  return { text: "I heard you! Let's build something!", actions: [] };
}
export async function handleAICommand(payload: any, broadcast?: (msg: any) => void, customConfig?: any): Promise<{ code: string; explanation: string }> {
  const apiKey = customConfig?.apiKey || process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const tier = (payload?.tier as keyof typeof TIER_MODELS) || "standard";
  const codeModel = TIER_MODELS[tier].tool;
  const userMessage = payload?.message || "";
  
  // 1. Context Injection based on robot template!
  const robotType = payload?.robotType || "Rover";
  const customContext = payload?.robotContext 
    ? buildContextFromTemplate(robotType, payload.robotContext)
    : buildContextFromTemplate(robotType);

  // 2. Broadcast "Thinking" before starting computation
  if (broadcast) {
    broadcast({ 
      type: "thinking", 
      payload: { text: "Анализирую задачу и подбираю логику для сборки " + robotType + "..." } 
    });
  }

  if (!apiKey) {
    if (broadcast) {
      setTimeout(() => broadcast({ type: "speak", payload: { text: "Ошибка: Нет ключа API. Работаю в демо-режиме." } }), 1000);
    }
    return getFallbackResponse(userMessage);
  }

  try {
    if (broadcast) {
      broadcast({ type: "thinking", payload: { text: "Пишу код..." } });
    }

    const data = await fetchWithFallback(codeModel, {
      messages: [
        { role: "system", content: customContext }, // Injected Context!
        ...(payload.history || [{ role: "user", content: userMessage }]),
      ],
    }, customConfig);

    let content = data.choices?.[0]?.message?.content || "";

    // Strip markdown fences
    content = content.replace(/```(?:typescript|ts|javascript|js)?\n([\s\S]*?)```/gi, "$1");
    content = content.replace(/^```\n?/, "").replace(/\n?```$/, "").trim();

    if (broadcast) {
      broadcast({ type: "thinking", payload: { text: "Код готов!" } });
      // Send the text explanation to TTS as Beka requested!
      broadcast({ type: "speak", payload: { text: "Я написал логику! Запускаю." } });
    }

    return {
      code: content,
      explanation: `Generated code for: "${userMessage}"`,
    };
  } catch (e) {
    console.error("[AI] Error:", e);
    return getFallbackResponse(userMessage);
  }
}


export async function generateMCPTool(prompt: string, tier: keyof typeof TIER_MODELS = "standard", broadcast?: (msg: any) => void, customConfig?: any): Promise<{ name: string; code: string; description: string }> {
  const apiKey = customConfig?.apiKey || process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const chatModel = TIER_MODELS[tier].orchestrator;
  // ... rest of metaPrompt ...
  const metaPrompt = `You are a Senior TypeScript Developer writing MCP tools for the BrainBricks robot platform.
The user will request a tool. You must respond with raw stringified JSON only (no markdown, no extra text).
The JSON MUST match this schema:
{
  "name": "CamelCaseNameOfTool",
  "description": "Short description of what the tool does",
  "code": "A single javascript string representing the executable function body. It should be async and return a string. E.g. 'const r = await fetch(\\\'...\\\'); return await r.text();'"
}

User request: ${prompt}`;

  if (broadcast) broadcast({ type: "thinking", payload: { text: "Проектирую архитектуру нового MCP-инструмента..." } });

  try {
    if (!apiKey) throw new Error("API Key is missing");
    const data = await fetchWithFallback(chatModel, {
      messages: [
        { role: "system", content: metaPrompt },
        { role: "user", content: `Create a tool for: ${prompt}. Only output the JSON.` }
      ]
    }, customConfig);
    
    if (broadcast) broadcast({ type: "thinking", payload: { text: "Инструмент написан! Форматирую JSON..." } });

    let content = data.choices?.[0]?.message?.content || "{}";
    
    // Clean potential markdown
    content = content.replace(/```(?:json)?\n([\s\S]*?)```/gi, "$1").trim();
    
    if (broadcast) broadcast({ type: "speak", payload: { text: "Твой новый инструмент готов к установке!" } });
    
    return JSON.parse(content);
  } catch (e) {
    console.error("[AI MCP Gen] Error:", e);
    return { name: "ErrorTool", description: "Failed to generate tool", code: "return 'error';" };
  }
}

function getFallbackResponse(message: string): { code: string; explanation: string } {
  const lower = message.toLowerCase();

  if (lower.includes("forward") || lower.includes("вперёд")) {
    return {
      code: `// Move forward at 50% speed
moveForward(50);
wait(2000);
stop();`,
      explanation: "Robot moves forward for 2 seconds then stops.",
    };
  }

  if (lower.includes("square") || lower.includes("квадрат")) {
    return {
      code: `// Drive in a square pattern
for (let i = 0; i < 4; i++) {
  moveForward(50);
  wait(1500);
  stop();
  turnRight(50, 500);
}`,
      explanation: "Robot drives in a square: forward, turn right, repeat 4 times.",
    };
  }

  if (lower.includes("red") || lower.includes("красн")) {
    return {
      code: `// Drive forward until red object is detected
moveForward(30);
waitForColor("red");
stop();
speak("I found something red!");`,
      explanation: "Robot drives slowly until it sees red, then stops and announces it.",
    };
  }

  return {
    code: `// Default: move forward and back
moveForward(50);
wait(1000);
stop();
wait(500);
moveBackward(50);
wait(1000);
stop();
speak("Hello! I am your BrainBricks robot!");`,
    explanation: `No specific command detected for "${message}". Running default demo sequence.`,
  };
}
export async function handleExpertReasoning(task: string, imageData: string, tier: keyof typeof TIER_MODELS = "standard", robotType: string = "rover", broadcast?: (msg: any) => void): Promise<{ code: string; explanation: string }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const expertModel = TIER_MODELS[tier].tool; 
  
  if (broadcast) {
    broadcast({ type: "thinking", payload: { text: "АКТИВАЦИЯ РЕЖИМА ЭКСПЕРТА..." } });
    broadcast({ type: "speak", payload: { text: "Переключаюсь на протокол экспертного рассуждения. Это будет стоить пятьдесят кирпичей." } });
  }

  const success = await memory.deductBricks(50);
  if (!success) {
    if (broadcast) broadcast({ type: "speak", payload: { text: "Ошибка: недостаточно кирпичей для вызова эксперта." } });
    return { code: "", explanation: "Insufficient Bricks" };
  }

  const currentMemory = await memory.getMemory();
  const manifest = currentMemory.manifest || { parts: [] };
  
  // Use the processExpertReasoning logic but format as code for compatibility
  const result = await processExpertReasoning(manifest, task, imageData);
  
  let generatedCode = "// AI Expert Execution\n";
  result.commands.forEach((cmd: any) => {
    if (cmd.functionName === "setSpeed") {
      generatedCode += `setSpeed("${cmd.args.port}", ${cmd.args.speed});\n`;
    } else if (cmd.functionName === "setPosition") {
      generatedCode += `setPosition("${cmd.args.port}", ${cmd.args.angle});\n`;
    }
  });
  generatedCode += "wait(2000);\nstop();";

  return {
    code: generatedCode,
    explanation: result.thought
  };
}

export async function neuralForge(type: "build" | "mcp" | "persona", prompt: string, options: any = {}): Promise<any> {
  const model = "gemini-3-flash"; // More power for the Forge
  let systemPrompt = "";

  if (type === "build") {
    systemPrompt = `You are a Master Roboticist and 3D Designer.
Your task is to generate a detailed 3D robot build configuration for the BrainBricks platform.
The robot is built using discrete parts in a 3D coordinate system (PowerPoint-style constructor).

CHASSIS TYPE: ${options.chassis || "universal"}

RESPOND WITH JSON ONLY:
{
  "name": "Creative Robot Name",
  "description": "Engaging technical description",
  "parts": [
    { 
      "id": "unique_id_1", 
      "type": "cube|sphere|cylinder|motor|sensor|wheel", 
      "position": [x, y, z], 
      "rotation": [x, y, z],
      "color": "#HEXCODE",
      "properties": { "port": "A|B|C|D", "scale": [x, y, z] }
    }
  ],
  "logic": "Brief high-level explanation of how this robot behaves"
}

RULES:
1. Position parts logically (e.g., wheels at the bottom, sensors at the front).
2. Use at least 5-10 parts to create a meaningful structure.
3. If an image is provided, recreate the robot from the image as accurately as possible in 3D.`;
  } else if (type === "mcp") {
    systemPrompt = `You are an Expert Software Engineer specialized in Robotics and MCP (Model Context Protocol).
Your task is to generate a functional, real-world MCP tool for a robot brain.

RESPOND WITH JSON ONLY:
{
  "name": "Tool Name",
  "description": "What it does",
  "price": 150,
  "code": "A complete, executable JavaScript function or class that implements the logic. Use standard Web APIs or the provided Robot Context.",
  "schema": { "input": { "type": "object", "properties": { ... } } }
}

Example Code Target:
async function execute(params) { 
  // Real implementation here
  // e.g. return await fetch('https://api.weather.com/...') 
}`;
  } else {
    systemPrompt = `Create a complex robot persona.
RESPOND WITH JSON ONLY:
{
  "name": "Personality Name",
  "description": "Deep psychological profile",
  "prompt": "Full system prompt instructions for the AI brain",
  "price": 50
}`;
  }

  const messages: any[] = [{ role: "user", content: [{ type: "text", text: `${systemPrompt}\n\nUSER REQUEST: ${prompt}` }] }];
  
  if (options.image) {
    messages[0].content.push({ type: "image_url", image_url: { url: options.image } });
  }

  try {
    const data = await fetchWithFallback(model, { messages });
    const content = data.choices[0].message.content.replace(/```json\n?|\n?```/g, "").trim();
    return JSON.parse(content);
  } catch (e) {
    console.error("[Neural Forge] Error:", e);
    throw e;
  }
}

export async function processExpertReasoning(manifest: BuildManifest, userCommand: string, imageDelta?: string): Promise<{ thought: string; commands: AICallbackCommand[] }> {
  const apiKey = process.env.GOOGLE_API_KEY || process.env.ZAI_API_KEY || process.env.OPENROUTER_API_KEY;
  const expertModel = TIER_MODELS.pro.tool; // Always use ER 1.6 for the Universal Pilot

  const hardwareContext = manifest.parts.map((p: HardwarePart) => 
    `- Port ${p.port || 'N/A'}: ${p.type.toUpperCase()} (${p.role || 'no specific role'})`
  ).join('\n');

  const systemPrompt = `You are the BrainBricks Universal Pilot (Gemini ER 1.6). 
Your task is to control a robot by providing structured commands based on its hardware manifest.

HARDWARE MANIFEST:
${hardwareContext}

TASK: "${userCommand}"

RULES:
1. Analyze the robot's capabilities.
2. Return a JSON object with:
   - "thought": Your reasoning in Russian.
   - "commands": An array of objects: { "functionName": "setSpeed" | "setPosition", "args": { "port": "A"|"B"|..., "speed": -100..100, "angle": 0..360 } }
3. If no action is needed, return an empty commands array.
4. ONLY return valid JSON. No markdown.`;

  try {
    const data = await fetchWithFallback(expertModel, {
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: systemPrompt },
            ...(imageDelta ? [{ type: "image_url", image_url: { url: imageDelta } }] : [])
          ]
        }
      ]
    });

    let content = data.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?|\n?```/g, "").trim();
    
    const parsed = JSON.parse(content);
    return {
      thought: parsed.thought || "Команда принята.",
      commands: parsed.commands || []
    };
  } catch (e) {
    console.error("[Universal Pilot] Error:", e);
    return { thought: "Ошибка нейронной связи.", commands: [] };
  }
}
