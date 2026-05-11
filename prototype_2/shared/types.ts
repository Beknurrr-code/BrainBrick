// Shared types between client and server

export interface RobotMotor {
  port: string;       // "A", "B", "C", "D"
  speed: number;      // -100 to 100
}

export interface SensorData {
  accel?: { x: number; y: number; z: number };
  gyro?: { x: number; y: number; z: number };
  timestamp: number;
}

export interface WSMessage {
  type: "motor" | "stop" | "frame" | "sensor" | "speak" | "ai_command" | "ai_response" | "robot_connected" | "robot_disconnected" | "error";
  payload?: any;
}

export interface RobotBuild {
  id: string;
  name: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  parts: string[];
  imageUrl: string;
  steps: BuildStep[];
}

export interface BuildStep {
  step: number;
  title: string;
  description: string;
  imageUrl?: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface HardwarePart {
  id: string;
  type: string;
  port?: string;
  role?: string;
}

export interface BuildManifest {
  id: string;
  name: string;
  parts: HardwarePart[];
  version?: string;
}

export interface AICallbackCommand {
  functionName: string;
  args: {
    port: string;
    speed?: number;
    angle?: number;
    [key: string]: any;
  };
}