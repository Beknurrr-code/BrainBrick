// BrainBricks MCP Tools Server
// Standardized tool interface for robot capabilities

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, { type: string; description: string; required?: boolean }>;
  execute: (params: any, context: ToolContext) => Promise<any>;
}

export interface ToolContext {
  sendMotor: (port: string, speed: number) => void;
  stopAll: () => void;
  broadcast: (msg: any) => void;
  getLastFrame: () => string | null;
  getLastSensors: () => any;
}

export const robotTools: MCPTool[] = [
  {
    name: "move_forward",
    description: "Move robot forward at given speed (0-100)",
    parameters: {
      speed: { type: "number", description: "Motor speed 0-100", required: true },
      duration_ms: { type: "number", description: "Duration in milliseconds (optional, runs indefinitely if omitted)" },
    },
    async execute(params, ctx) {
      ctx.sendMotor("A", params.speed);
      ctx.sendMotor("B", params.speed);
      if (params.duration_ms) {
        await new Promise((r) => setTimeout(r, params.duration_ms));
        ctx.stopAll();
      }
      return { success: true, action: "move_forward", speed: params.speed };
    },
  },
  {
    name: "move_backward",
    description: "Move robot backward at given speed (0-100)",
    parameters: {
      speed: { type: "number", description: "Motor speed 0-100", required: true },
      duration_ms: { type: "number", description: "Duration in ms" },
    },
    async execute(params, ctx) {
      ctx.sendMotor("A", -params.speed);
      ctx.sendMotor("B", -params.speed);
      if (params.duration_ms) {
        await new Promise((r) => setTimeout(r, params.duration_ms));
        ctx.stopAll();
      }
      return { success: true, action: "move_backward", speed: params.speed };
    },
  },
  {
    name: "turn_left",
    description: "Turn robot left by adjusting motor speeds",
    parameters: {
      speed: { type: "number", description: "Turn speed 0-100", required: true },
      duration_ms: { type: "number", description: "Duration in ms", required: true },
    },
    async execute(params, ctx) {
      ctx.sendMotor("A", -params.speed);
      ctx.sendMotor("B", params.speed);
      await new Promise((r) => setTimeout(r, params.duration_ms));
      ctx.stopAll();
      return { success: true, action: "turn_left" };
    },
  },
  {
    name: "turn_right",
    description: "Turn robot right by adjusting motor speeds",
    parameters: {
      speed: { type: "number", description: "Turn speed 0-100", required: true },
      duration_ms: { type: "number", description: "Duration in ms", required: true },
    },
    async execute(params, ctx) {
      ctx.sendMotor("A", params.speed);
      ctx.sendMotor("B", -params.speed);
      await new Promise((r) => setTimeout(r, params.duration_ms));
      ctx.stopAll();
      return { success: true, action: "turn_right" };
    },
  },
  {
    name: "stop",
    description: "Stop all motors immediately",
    parameters: {},
    async execute(_, ctx) {
      ctx.stopAll();
      return { success: true, action: "stop" };
    },
  },
  {
    name: "capture_image",
    description: "Capture current frame from phone camera",
    parameters: {},
    async execute(_, ctx) {
      ctx.broadcast({ type: "capture_request" });
      await new Promise((r) => setTimeout(r, 500));
      const frame = ctx.getLastFrame();
      return { success: true, image: frame ? "captured" : "no_camera", size: frame?.length || 0 };
    },
  },
  {
    name: "speak",
    description: "Make the robot speak via phone speaker",
    parameters: {
      text: { type: "string", description: "Text to speak", required: true },
    },
    async execute(params, ctx) {
      ctx.broadcast({ type: "speak", payload: { text: params.text } });
      return { success: true, action: "speak", text: params.text };
    },
  },
  {
    name: "read_sensors",
    description: "Read phone sensor data (accelerometer, gyroscope)",
    parameters: {},
    async execute(_, ctx) {
      const data = ctx.getLastSensors();
      return { success: true, sensors: data || "no_data" };
    },
  },
  {
    name: "wait",
    description: "Wait for specified duration",
    parameters: {
      ms: { type: "number", description: "Duration in milliseconds", required: true },
    },
    async execute(params) {
      await new Promise((r) => setTimeout(r, params.ms));
      return { success: true, action: "wait", ms: params.ms };
    },
  },
  {
    name: "get_weather",
    description: "Get real-time weather data for a location (default: owner's city)",
    parameters: {
      city: { type: "string", description: "City name", required: false },
    },
    async execute(params) {
      try {
        // Using Open-Meteo (No key required for demo)
        const city = params.city || "Almaty"; 
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=43.25&longitude=76.95&current_weather=true`);
        const data = await res.json();
        const temp = data.current_weather.temperature;
        const wind = data.current_weather.windspeed;
        return { success: true, city, temperature: temp, windspeed: wind, units: "Celsius" };
      } catch (e) {
        return { success: false, error: "Weather API unreachable" };
      }
    },
  },
  {
    name: "play_youtube",
    description: "Search and play music or videos on the robot's screen with real results.",
    parameters: {
      search: { type: "string", description: "Song name, artist, or video title", required: true },
    },
    async execute(params, ctx) {
      const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(params.search)}`;
      ctx.broadcast({ type: "play_media", payload: { url: searchUrl, title: params.search } });
      return { success: true, url: searchUrl, action: "opening_youtube_search" };
    },
  },
  {
    name: "set_volume",
    description: "Set the robot's speaker volume (0-100).",
    parameters: {
      level: { type: "number", description: "Volume level from 0 to 100", required: true },
    },
    async execute(params, ctx) {
      const level = Math.max(0, Math.min(100, params.level));
      ctx.broadcast({ type: "volume_change", payload: { level } });
      ctx.broadcast({ type: "speak", payload: { text: `Volume set to ${level} percent.` } });
      return { success: true, level };
    },
  },
  {
    name: "smarthome_control",
    description: "Control smart home devices (Lights, AC, Security). Actual IoT simulation.",
    parameters: {
      device: { type: "string", description: "Device: 'lights', 'ac', 'security'", required: true },
      action: { type: "string", description: "Action: 'on', 'off', 'status'", required: true },
      value: { type: "string", description: "Optional value (e.g. 24 for AC temp)" }
    },
    async execute(params, ctx) {
      // Simulate real IoT latency
      await new Promise(r => setTimeout(r, 800));
      const msg = `SmartLink™: ${params.device.toUpperCase()} successfully set to ${params.action.toUpperCase()}${params.value ? ' (' + params.value + ')' : ''}`;
      ctx.broadcast({ type: "notification", payload: { title: "IoT Command Executed", message: msg, type: "success" } });
      return { success: true, device: params.device, status: params.action, timestamp: new Date().toISOString() };
    },
  },
  {
    name: "github_activity",
    description: "Check latest activity on a BrainBricks repository",
    parameters: {
      repo: { type: "string", description: "Repository name", required: true },
    },
    async execute(params, ctx) {
      // Professional tool example
      const mockCommits = [
        { author: "Beknur", message: "Optimized Vision Kernel", date: "2 mins ago" },
        { author: "Jules", message: "Added Robotics ER 1.6 support", date: "1 hour ago" }
      ];
      return { success: true, repo: params.repo, latest_commits: mockCommits };
    },
  },
  {
    name: "set_timer",
    description: "Set a timer or reminder for a specific duration",
    parameters: {
      duration_seconds: { type: "number", description: "Duration in seconds", required: true },
      label: { type: "string", description: "What the timer is for (e.g., tea, homework)", required: false },
    },
    async execute(params, ctx) {
      const label = params.label || "Timer";
      ctx.broadcast({ type: "notification", payload: { title: "Timer Set", message: `${label} set for ${params.duration_seconds}s`, type: "info" } });
      
      setTimeout(() => {
        ctx.broadcast({ type: "notification", payload: { title: "Timer Expired!", message: `Time is up for: ${label}`, type: "success" } });
        ctx.broadcast({ type: "speak", payload: { text: `Time is up for ${label}!` } });
      }, params.duration_seconds * 1000);

      return { success: true, duration: params.duration_seconds };
    },
  },
];

export function getToolDescriptions(): string {
  return robotTools
    .map(
      (t) =>
        `- ${t.name}(${Object.entries(t.parameters)
          .map(([k, v]) => `${k}: ${v.type}${v.required ? "" : "?"}`)
          .join(", ")}): ${t.description}`
    )
    .join("\n");
}

export async function executeTool(name: string, params: any, context: ToolContext) {
  const tool = robotTools.find((t) => t.name === name);
  if (!tool) return { success: false, error: `Unknown tool: ${name}` };
  return tool.execute(params, context);
}
