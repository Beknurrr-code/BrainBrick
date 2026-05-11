import { handleLegoCommand } from "./lego.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SandboxResolve = (value: any) => void;

const pendingCaptures = new Map<string, SandboxResolve>();
const pendingColorWaits = new Map<string, SandboxResolve>();
let lastFrame: string | null = null;
let lastSensorData: any = null;

export function setLastFrame(frame: string) {
  lastFrame = frame;
  // Resolve any pending captureImage
  for (const [id, resolve] of pendingCaptures) {
    resolve(lastFrame);
    pendingCaptures.delete(id);
  }
}

export function setLastSensorData(data: any) {
  lastSensorData = data;
}

export function registerColorWait(id: string, resolve: SandboxResolve) {
  pendingColorWaits.set(id, resolve);
}

export function resolveColorWait(color: string) {
  // Called when vision detects a color — resolve all waits for that color
  for (const [id, resolve] of pendingColorWaits) {
    resolve(true);
    pendingColorWaits.delete(id);
  }
}

// The robot API available to sandboxed code
// The robot API available to sandboxed code
function createRobotAPI(broadcast: (msg: any) => void, robotType: string = "rover") {
  const type = robotType.toLowerCase();

  return {
    moveForward(speed: number) {
      if (type === "arm") {
        handleLegoCommand({ type: "motor", payload: { port: "A", speed } }); // Base rotation
      } else {
        handleLegoCommand({ type: "motor", payload: { port: "A", speed } });
        handleLegoCommand({ type: "motor", payload: { port: "B", speed } });
      }
    },
    moveBackward(speed: number) {
      this.moveForward(-speed);
    },
    turnLeft(speed: number, ms: number) {
      if (type === "arm") {
        handleLegoCommand({ type: "motor", payload: { port: "B", speed: -speed } }); // Lift up
      } else {
        handleLegoCommand({ type: "motor", payload: { port: "A", speed: -speed } });
        handleLegoCommand({ type: "motor", payload: { port: "B", speed } });
      }
      return new Promise((r) => setTimeout(r, ms));
    },
    turnRight(speed: number, ms: number) {
      if (type === "arm") {
        handleLegoCommand({ type: "motor", payload: { port: "B", speed } }); // Lower
      } else {
        handleLegoCommand({ type: "motor", payload: { port: "A", speed } });
        handleLegoCommand({ type: "motor", payload: { port: "B", speed: -speed } });
      }
      return new Promise((r) => setTimeout(r, ms));
    },
    stop() {
      handleLegoCommand({ type: "stop" });
    },
    // Arm Specific
    clawOpen() {
      if (type === "arm") handleLegoCommand({ type: "motor", payload: { port: "D", speed: 50, duration: 500 } });
    },
    clawClose() {
      if (type === "arm") handleLegoCommand({ type: "motor", payload: { port: "D", speed: -50, duration: 500 } });
    },
    elbowUp(speed: number) {
      if (type === "arm") handleLegoCommand({ type: "motor", payload: { port: "C", speed } });
    },
    elbowDown(speed: number) {
      if (type === "arm") handleLegoCommand({ type: "motor", payload: { port: "C", speed: -speed } });
    },
    // Pet Specific
    wagTail(times: number = 3) {
      if (type === "pet") {
        for(let i=0; i<times; i++) {
           handleLegoCommand({ type: "motor", payload: { port: "D", speed: 40, duration: 200 } });
           handleLegoCommand({ type: "motor", payload: { port: "D", speed: -40, duration: 200 } });
        }
      }
    },
    tiltHead(dir: string) {
      if (type === "pet") handleLegoCommand({ type: "motor", payload: { port: "C", speed: 30, duration: 500 } });
    },
    captureImage(): Promise<string> {
      const id = Math.random().toString(36).slice(2);
      broadcast({ type: "capture_request" });
      return new Promise((resolve) => {
        if (lastFrame) {
          resolve(lastFrame);
          return;
        }
        pendingCaptures.set(id, resolve);
        setTimeout(() => {
          if (pendingCaptures.has(id)) {
            pendingCaptures.delete(id);
            resolve("");
          }
        }, 5000);
      });
    },
    speak(text: string) {
      broadcast({ type: "speak", payload: { text } });
    },
    waitForColor(color: string): Promise<boolean> {
      broadcast({ type: "wait_for_color", payload: { color } });
      const id = Math.random().toString(36).slice(2);
      return new Promise((resolve) => {
        pendingColorWaits.set(id, resolve);
        setTimeout(() => {
          if (pendingColorWaits.has(id)) {
            pendingColorWaits.delete(id);
            resolve(false);
          }
        }, 30000);
      });
    },
    readSensors() {
      return lastSensorData || { accel: { x: 0, y: 0, z: 0 }, gyro: { x: 0, y: 0, z: 0 } };
    },
    wait(ms: number) {
      return new Promise((r) => setTimeout(r, ms));
    },
  };
}

export async function executeCode(
  code: string,
  broadcast: (msg: any) => void,
  robotType: string = "rover"
): Promise<{ success: boolean; error?: string; logs: string[] }> {
  const logs: string[] = [];
  const robot = createRobotAPI(broadcast, robotType);

  // Log helper
  const log = (...args: unknown[]) => {
    const msg = args.map(String).join(" ");
    logs.push(msg);
    broadcast({ type: "execution_log", payload: { log: msg } });
  };

  try {
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction(
      "moveForward", "moveBackward", "turnLeft", "turnRight", "stop", 
      "clawOpen", "clawClose", "elbowUp", "elbowDown",
      "wagTail", "tiltHead",
      "captureImage", "speak", "waitForColor", "readSensors", "wait", "console",
      code
    );

    await fn(
      robot.moveForward.bind(robot),
      robot.moveBackward.bind(robot),
      robot.turnLeft.bind(robot),
      robot.turnRight.bind(robot),
      robot.stop.bind(robot),
      robot.clawOpen.bind(robot),
      robot.clawClose.bind(robot),
      robot.elbowUp.bind(robot),
      robot.elbowDown.bind(robot),
      robot.wagTail.bind(robot),
      robot.tiltHead.bind(robot),
      robot.captureImage.bind(robot),
      robot.speak.bind(robot),
      robot.waitForColor.bind(robot),
      robot.readSensors.bind(robot),
      robot.wait.bind(robot),
      { log, error: log, warn: log }
    );

    return { success: true, logs };
  } catch (e: any) {
    return { success: false, error: e.message, logs };
  }
}
