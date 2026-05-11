// LEGO Mindstorms 51515 BLE service using node-poweredup
// Enhanced for Precision Robotics & Inverse Kinematics

let hub: any = null;
let connected = false;

export async function initLego() {
  const useSimulated = !process.env.LEGO_HUB_NAME;
  if (useSimulated) {
    console.log("[LEGO] Running in SIMULATED mode (set LEGO_HUB_NAME to enable real hardware)");
    return;
  }

  try {
    const { PoweredUP } = await import("node-poweredup");
    const poweredUp = new PoweredUP();

    poweredUp.on("discover", async (discoveredHub: any) => {
      console.log(`[LEGO] Found hub: ${discoveredHub.name}`);
      await discoveredHub.connect();
      hub = discoveredHub;
      connected = true;
      console.log("[LEGO] Connected and Ready for Precision Control!");
    });

    poweredUp.scan();
    console.log("[LEGO] Scanning for Mindstorms hub...");
  } catch (e) {
    console.error("[LEGO] Failed to initialize:", e);
    console.log("[LEGO] Falling back to SIMULATED mode");
  }
}

export async function handleLegoCommand(msg: any) {
  const useSimulated = !process.env.LEGO_HUB_NAME;
  
  if (useSimulated || !hub) {
    console.log(`[LEGO SIMULATED] ${msg.type}:`, JSON.stringify(msg.payload));
    return;
  }

  try {
    const { port, speed, angle, degrees, duration } = msg.payload || {};

    switch (msg.type) {
      case "stop":
        // Stop all common ports for safety
        ["A", "B", "C", "D", "E", "F"].forEach(async (p) => {
          try { await hub.setMotorSpeed(p, 0); } catch {}
        });
        break;

      case "motor":
        // Classic speed control
        await hub.setMotorSpeed(port, speed || 0);
        if (duration) {
          setTimeout(async () => {
            try { await hub.setMotorSpeed(port, 0); } catch {}
          }, duration);
        }
        break;

      case "motor_angle":
        // Absolute positioning (Critical for Drawing/Arms)
        // Uses internal encoder to go to specific degree
        if (hub.setMotorAngle) {
          await hub.setMotorAngle(port, angle, speed || 50);
        } else {
          console.warn("[LEGO] setMotorAngle not supported on this hub/library version");
        }
        break;

      case "motor_rotate":
        // Relative positioning
        if (hub.rotateMotor) {
          await hub.rotateMotor(port, degrees, speed || 50);
        }
        break;

      case "acceleration":
        // Smooth movement profiles
        if (hub.setAccelerationTime) {
          await hub.setAccelerationTime(port, duration || 500);
        }
        break;

      default:
        console.log(`[LEGO] Unknown command type: ${msg.type}`);
    }
  } catch (e) {
    console.error("[LEGO] Command failed:", e);
  }
}

export function isConnected() {
  return connected;
}
