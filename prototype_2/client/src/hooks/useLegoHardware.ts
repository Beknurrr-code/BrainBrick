import { useState, useCallback, useEffect } from "react";
import { legoBLE } from "../services/webBluetooth";
import { useSocket } from "./useSocket";

export function useLegoHardware() {
  const [hubConnected, setHubConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const { send: sendToSocket, on, connected: socketConnected } = useSocket();

  const connectBLE = useCallback(async () => {
    setConnecting(true);
    const success = await legoBLE.connect();
    setHubConnected(success);
    setConnecting(false);
    return success;
  }, []);

  const connectUSB = useCallback(async () => {
    setConnecting(true);
    const success = await legoBLE.connectSerial();
    setHubConnected(success);
    setConnecting(false);
    return success;
  }, []);

  const disconnect = useCallback(async () => {
    await legoBLE.disconnect();
    setHubConnected(false);
  }, []);

  const sendCommand = useCallback(async (type: string, payload: any) => {
    // If hardware is active, send direct commands
    if (hubConnected && (legoBLE as any).isConnected) {
      if (type === "motor") {
        await legoBLE.setMotorSpeed(payload.port, payload.speed);
        return;
      }
      if (type === "stop") {
        await legoBLE.stopAll();
        return;
      }
    }

    // Fallback to WebSocket (Simulation or Server-side Hub)
    sendToSocket(type, payload);
  }, [hubConnected, sendToSocket]);

  // Monitor connection status
  useEffect(() => {
    const timer = setInterval(() => {
      const current = (legoBLE as any).isConnected;
      if (hubConnected !== current) {
        setHubConnected(current);
      }
    }, 2000);
    return () => clearInterval(timer);
  }, [hubConnected]);

  // Listen for AI-generated commands from the server
  useEffect(() => {
    on("motor", (payload: any) => {
      if (hubConnected) {
        legoBLE.setMotorSpeed(payload.port, payload.speed);
      }
    });
    on("stop", () => {
      if (hubConnected) {
        legoBLE.stopAll();
      }
    });
  }, [hubConnected]);

  return {
    connectBLE,
    connectUSB,
    disconnect,
    sendCommand,
    hubConnected,
    socketConnected,
    connecting
  };
}
