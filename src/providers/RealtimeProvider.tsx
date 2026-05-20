/**
 * src/providers/RealtimeProvider.tsx
 *
 * React context that tracks the Socket.io connection state and exposes it
 * to all child components without prop-drilling.
 *
 * Responsibilities:
 *   1. Connect to the WebSocket server when the user is authenticated.
 *   2. Join the restaurant room when restaurantId becomes available.
 *   3. Expose connection status, latency, and the restaurant ID.
 *   4. Disconnect cleanly when the component unmounts.
 *
 * Usage:
 *   Wrap your authenticated layout with <RealtimeProvider restaurantId={id}>
 *   Then read state with useRealtimeContext() in any child.
 */

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import {
  ensureConnected,
  disconnect,
  joinRestaurantRoom,
  measureLatency,
  getSocket,
} from "@/realtime/client";

// ── Context shape ──────────────────────────────────────────────────────────────

export interface RealtimeContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  latencyMs: number | null;
  restaurantId: number | null;
  connectionError: string | null;
  reconnectAttempt: number;
}

const RealtimeContext = createContext<RealtimeContextValue>({
  isConnected: false,
  isConnecting: false,
  latencyMs: null,
  restaurantId: null,
  connectionError: null,
  reconnectAttempt: 0,
});

// ── Provider ───────────────────────────────────────────────────────────────────

interface RealtimeProviderProps {
  restaurantId: number;
  enabled?: boolean;
  children: ReactNode;
}

export function RealtimeProvider({ restaurantId, enabled = true, children }: RealtimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [reconnectAttempt, setReconnectAttempt] = useState(0);

  // Latency probe every 30 seconds while connected.
  const probeLatency = useCallback(async () => {
    try {
      const ms = await measureLatency();
      setLatencyMs(ms);
    } catch {
      // Non-fatal — connection may have just dropped.
    }
  }, []);

  useEffect(() => {
    if (!enabled) {
      setIsConnected(false);
      setIsConnecting(false);
      setLatencyMs(null);
      setConnectionError("Realtime disabled");
      setReconnectAttempt(0);
      disconnect();
      return;
    }

    const s = ensureConnected();

    const onConnect = () => {
      setIsConnected(true);
      setIsConnecting(false);
      setConnectionError(null);
      setReconnectAttempt(0);
      // Join the restaurant room immediately after connecting.
      joinRestaurantRoom(restaurantId);
      probeLatency();
    };

    const onDisconnect = () => {
      setIsConnected(false);
      setLatencyMs(null);
    };

    const onConnectError = (err: Error) => {
      setIsConnecting(false);
      setConnectionError(err.message);
    };

    const onReconnectAttempt = (attempt: number) => {
      setIsConnecting(true);
      setReconnectAttempt(attempt);
    };

    const onJoined = (_room: string) => {
      // Room confirmation — nothing to do in the provider.
    };

    if (s.connected) {
      onConnect();
    } else {
      setIsConnecting(true);
    }

    s.on("connect",          onConnect);
    s.on("disconnect",       onDisconnect);
    s.on("connect_error",    onConnectError);
    s.io.on("reconnect_attempt", onReconnectAttempt);
    s.on("joined",           onJoined);

    // Latency probe interval.
    const latencyInterval = setInterval(() => {
      if (s.connected) probeLatency();
    }, 30_000);

    // Re-join room after reconnection.
    const onReconnect = () => {
      joinRestaurantRoom(restaurantId);
    };
    s.io.on("reconnect", onReconnect);

    return () => {
      s.off("connect",          onConnect);
      s.off("disconnect",       onDisconnect);
      s.off("connect_error",    onConnectError);
      s.io.off("reconnect_attempt", onReconnectAttempt);
      s.off("joined",           onJoined);
      s.io.off("reconnect",        onReconnect);
      clearInterval(latencyInterval);
      disconnect();
    };
  }, [restaurantId, probeLatency, enabled]);

  return (
    <RealtimeContext.Provider
      value={{
        isConnected,
        isConnecting,
        latencyMs,
        restaurantId,
        connectionError,
        reconnectAttempt,
      }}
    >
      {children}
    </RealtimeContext.Provider>
  );
}

export function useRealtimeContext(): RealtimeContextValue {
  return useContext(RealtimeContext);
}
