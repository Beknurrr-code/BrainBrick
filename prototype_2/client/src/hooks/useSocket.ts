import { useRef, useEffect, useState, useCallback } from "react";

type Handler = (payload: any) => void;

export function useSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const listenersRef = useRef<Record<string, Set<Handler>>>({});
  const connectedRef = useRef(false);

  const send = useCallback((type: string, payload?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
    }
  }, []);

  const on = useCallback((type: string, handler: Handler) => {
    if (!listenersRef.current[type]) {
      listenersRef.current[type] = new Set();
    }
    listenersRef.current[type].add(handler);

    // Return unsubscribe function
    return () => {
      listenersRef.current[type]?.delete(handler);
    };
  }, []);

  useEffect(() => {
    const BACKEND_IP = "192.168.68.71:3001";
    const wsUrl = `ws://${BACKEND_IP}/ws`;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        connectedRef.current = true;
        setConnected(true);
      };

      ws.onclose = () => {
        connectedRef.current = false;
        setConnected(false);
        setTimeout(() => {
          if (!connectedRef.current) connect();
        }, 2000);
      };

      ws.onerror = () => ws.close();

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          const handlers = listenersRef.current[msg.type];
          if (handlers) {
            handlers.forEach(h => h(msg.payload));
          }
        } catch {}
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, []);

  return { send, on, connected };
}
