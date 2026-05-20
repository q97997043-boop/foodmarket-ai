/**
 * src/realtime/client.ts
 *
 * Socket.io client singleton.
 *
 * A singleton is correct here because:
 *   - One WebSocket connection per browser tab is the right model.
 *   - Multiple components (OrderFeed, PriceTicker, FlashAlerts) all share
 *     the same physical connection; only the event subscriptions differ.
 *   - Prevents connection storms on page navigation within the SPA.
 *
 * Reconnection strategy:
 *   Socket.io's built-in exponential backoff handles transient disconnects.
 *   We set randomizationFactor=0.3 to spread reconnects across clients
 *   (avoids thundering-herd when the server restarts).
 *
 * The socket starts DISCONNECTED and only connects when a component calls
 * `ensureConnected()`.  This is lazy-connect — no WS traffic until the
 * user is on a page that needs realtime data.
 */

import { io, Socket } from "socket.io-client";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  RealtimeEvent,
  RTEventName,
} from "./types";

// Re-export types for component convenience
export type { RealtimeEvent, RTEventName };
export { RT } from "./types";

// ── Singleton socket ───────────────────────────────────────────────────────────

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: AppSocket | null = null;

function createSocket(): AppSocket {
  const token = localStorage.getItem("auth-token");
  return io(window.location.origin, {
    path: "/ws",
    // Prefer WebSocket; fall back to long-polling on networks that block WS.
    transports: ["websocket", "polling"],
    // Include session cookies for server-side authentication.
    withCredentials: true,
    auth: { token },
    // Reconnection: exponential backoff, 10 attempts max, 30s cap.
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1_000,
    reconnectionDelayMax: 30_000,
    randomizationFactor: 0.3,
    // Don't auto-connect — we call connect() explicitly.
    autoConnect: false,
    // Timeout per connection attempt.
    timeout: 10_000,
  });
}

export function getSocket(): AppSocket {
  if (!socket) {
    socket = createSocket();

    // ── Debug logging (development only) ──────────────────────────────────
    if (import.meta.env.DEV) {
      socket.on("connect",    () => console.log("[ws] connected  ", socket!.id));
      socket.on("disconnect", (r) => console.log("[ws] disconnected", r));
      socket.on("connect_error", (e) => console.warn("[ws] connect error", e.message));
      socket.io.on("reconnect", (n: number) => console.log(`[ws] reconnected after ${n} attempts`));
    }
  }

  return socket;
}

export function ensureConnected(): AppSocket {
  const s = getSocket();
  if (!s.connected) s.connect();
  return s;
}

export function disconnect(): void {
  socket?.disconnect();
}

// ── Latency measurement ────────────────────────────────────────────────────────

/** Returns round-trip latency in milliseconds. */
export function measureLatency(): Promise<number> {
  return new Promise((resolve, reject) => {
    const s = getSocket();
    if (!s.connected) return reject(new Error("Not connected"));

    const t0 = Date.now();
    s.emit("ping", t0);
    s.once("pong", (_ts: number) => resolve(Date.now() - t0));
    setTimeout(() => reject(new Error("Ping timeout")), 5_000);
  });
}

// ── Room management ────────────────────────────────────────────────────────────

const joinedRooms = new Set<string>();

export function joinRestaurantRoom(
  restaurantId: number,
  onJoined?: (room: string) => void,
): void {
  const roomKey = `restaurant:${restaurantId}`;
  if (joinedRooms.has(roomKey)) return;

  const s = ensureConnected();
  s.emit("join_restaurant", restaurantId, (room) => {
    joinedRooms.add(roomKey);
    onJoined?.(room);
  });
}

export function joinBranchRoom(
  restaurantId: number,
  branchId: number,
  onJoined?: (room: string) => void,
): void {
  const roomKey = `branch:${restaurantId}:${branchId}`;
  if (joinedRooms.has(roomKey)) return;

  const s = ensureConnected();
  s.emit("join_branch", restaurantId, branchId, (room) => {
    joinedRooms.add(roomKey);
    onJoined?.(room);
  });
}

// Clear joined rooms on disconnect so we rejoin on reconnect.
getSocket().on("disconnect", () => {
  joinedRooms.clear();
});
