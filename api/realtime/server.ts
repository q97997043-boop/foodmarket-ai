/**
 * api/realtime/server.ts
 *
 * Socket.io server — single source of truth for the WebSocket layer.
 *
 * Responsibilities:
 *   1. Create and configure the Socket.io Server instance.
 *   2. Authenticate every connection via the existing kimi_sid JWT cookie.
 *      Unauthenticated sockets may join :tv rooms (read-only dashboards).
 *   3. Manage restaurant-scoped and branch-scoped rooms.
 *   4. Heartbeat / ping-pong to detect stale connections.
 *   5. Rate-limit join events to prevent room-flooding.
 *
 * Scalability path:
 *   When you need multiple Node.js instances (horizontal scaling), replace
 *   the in-process adapter with the Redis adapter:
 *
 *     import { createAdapter } from "@socket.io/redis-adapter";
 *     import { createClient } from "redis";
 *     const pub = createClient({ url: env.redisUrl });
 *     const sub = pub.duplicate();
 *     await Promise.all([pub.connect(), sub.connect()]);
 *     io.adapter(createAdapter(pub, sub));
 *
 *   All broadcast/emit calls stay exactly the same — the adapter handles
 *   cross-process delivery transparently.
 */

import { Server } from "socket.io";
import type { Server as HttpServer } from "http";
import { prisma } from "../prisma-client";
import jwt from "jsonwebtoken";
import { env } from "../lib/env";
import { setIoInstance } from "./broadcaster";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
} from "../../src/realtime/types";
import { rooms } from "../../src/realtime/types";

// ── Module-level server instance ───────────────────────────────────────────────

let io: Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData> | null = null;

export function getIo() {
  return io;
}

// ── Auth helper ────────────────────────────────────────────────────────────────

async function authenticateSocket(socket: any): Promise<{
  userId?: string;
  userRole?: string;
  restaurantIds: number[];
  authenticated: boolean;
}> {
  try {
    const authHeader = socket.handshake.auth?.token;
    if (!authHeader) {
      return { restaurantIds: [], authenticated: false };
    }

    const decoded = jwt.verify(authHeader, env.JWT_SECRET) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { restaurant: true },
    });

    if (!user) {
      return { restaurantIds: [], authenticated: false };
    }

    let restaurantIds: number[] = [];
    if (user.role === "SUPERADMIN") {
      restaurantIds = [-1];
    } else if (user.restaurant?.legacyId) {
      restaurantIds = [user.restaurant.legacyId];
    }

    return {
      userId: user.id,
      userRole: user.role,
      restaurantIds,
      authenticated: true,
    };
  } catch {
    return { restaurantIds: [], authenticated: false };
  }
}

// ── Rate limiter ───────────────────────────────────────────────────────────────
// Simple sliding-window token bucket per socket to prevent join flooding.

const JOIN_LIMIT = 20;   // max joins
const JOIN_WINDOW = 60_000; // per minute

function makeRateLimiter() {
  const map = new Map<string, { count: number; resetAt: number }>();

  return {
    allow(socketId: string): boolean {
      const now = Date.now();
      const entry = map.get(socketId);

      if (!entry || now > entry.resetAt) {
        map.set(socketId, { count: 1, resetAt: now + JOIN_WINDOW });
        return true;
      }

      if (entry.count >= JOIN_LIMIT) return false;

      entry.count++;
      return true;
    },
    remove(socketId: string) {
      map.delete(socketId);
    },
  };
}

// ── Init ───────────────────────────────────────────────────────────────────────

export function initRealtimeServer(httpServer: HttpServer | any): void {
  if (io) {
    console.log("[realtime] Server already initialised — skipping.");
    return;
  }

  const rateLimiter = makeRateLimiter();

  io = new Server<ClientToServerEvents, ServerToClientEvents, Record<string, never>, SocketData>(
    httpServer,
    {
      path: "/ws",
      // Transports: prefer WebSocket, fall back to long-polling.
      // In production behind a load balancer, set transports: ["websocket"]
      // and ensure your LB passes Upgrade headers (nginx: proxy_http_version 1.1).
      transports: ["websocket", "polling"],

      cors: {
        origin: (origin, cb) => {
          // In production: restrict to your domain(s).
          // In dev: allow localhost.
          const allowed =
            !origin ||
            origin.startsWith("http://localhost") ||
            origin.startsWith("https://foodmarket");
          cb(null, allowed);
        },
        credentials: true,
      },

      // Heartbeat: 25 s interval, 20 s timeout before disconnecting a ghost.
      pingInterval: 25_000,
      pingTimeout: 20_000,

      // Limit message size to 1 MB (events are small; this guards against abuse).
      maxHttpBufferSize: 1e6,
    },
  );

  // Hand the instance to the broadcaster singleton.
  setIoInstance(io);

  // ── Auth middleware ──────────────────────────────────────────────────────────

  io.use(async (socket, next) => {
    const auth = await authenticateSocket(socket);

    socket.data.userId = auth.userId as any;
    socket.data.userRole = auth.userRole;
    socket.data.restaurantIds = auth.restaurantIds;
    socket.data.authenticated = auth.authenticated;

    // We allow unauthenticated sockets — they can only join :tv rooms.
    next();
  });

  // ── Connection handler ───────────────────────────────────────────────────────

  io.on("connection", (socket) => {
    const tag = socket.data.authenticated
      ? `user:${socket.data.userId}`
      : `anon:${socket.id.slice(0, 6)}`;

    console.log(`[realtime] ▲ connected  ${tag}`);

    // ── join_restaurant ──────────────────────────────────────────────────────

    socket.on("join_restaurant", async (restaurantId, cb) => {
      if (!rateLimiter.allow(socket.id)) {
        console.warn(`[realtime] rate-limited ${tag}`);
        return;
      }

      // Authorization: authenticated users may only join their own restaurants.
      // Unauthenticated sockets may join the :tv sub-room only.
      const isAdmin =
        socket.data.userRole === "SUPERADMIN" || socket.data.userRole === "OWNER";
      const ownsRestaurant =
        isAdmin ||
        socket.data.restaurantIds.includes(restaurantId) ||
        socket.data.restaurantIds.includes(-1); // admin sentinel

      if (socket.data.authenticated && !ownsRestaurant) {
        console.warn(`[realtime] ${tag} attempted to join restaurant:${restaurantId} — DENIED`);
        return;
      }

      const room = socket.data.authenticated
        ? rooms.restaurant(restaurantId)
        : rooms.tv(restaurantId);

      await socket.join(room);
      socket.emit("joined", room);
      if (typeof cb === "function") cb(room);

      console.log(`[realtime] ${tag} joined ${room}`);
    });

    // ── join_branch ──────────────────────────────────────────────────────────

    socket.on("join_branch", async (restaurantId, branchId, cb) => {
      if (!socket.data.authenticated) return;
      if (!rateLimiter.allow(socket.id)) return;

      const isAdmin =
        socket.data.userRole === "SUPERADMIN" || socket.data.userRole === "OWNER";
      const ownsRestaurant =
        isAdmin || socket.data.restaurantIds.includes(restaurantId);

      if (!ownsRestaurant) return;

      const room = rooms.branch(restaurantId, branchId);
      await socket.join(room);
      socket.emit("joined", room);
      if (typeof cb === "function") cb(room);

      console.log(`[realtime] ${tag} joined ${room}`);
    });

    // ── ping / pong latency check ────────────────────────────────────────────

    socket.on("ping", (clientTs) => {
      socket.emit("pong", clientTs);
    });

    // ── disconnect ───────────────────────────────────────────────────────────

    socket.on("disconnect", (reason) => {
      rateLimiter.remove(socket.id);
      console.log(`[realtime] ▼ disconnected ${tag} — ${reason}`);
    });
  });

  const addr = (httpServer as any).address?.();
  const port = addr && typeof addr === "object" ? addr.port : "?";
  console.log(`[realtime] Socket.io server ready on port ${port} (path: /ws)`);
}
