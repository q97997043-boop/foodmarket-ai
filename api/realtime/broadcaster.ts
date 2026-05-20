/**
 * api/realtime/broadcaster.ts
 *
 * Thin singleton wrapper around the Socket.io instance.
 *
 * Import `broadcast` anywhere in the server codebase to emit realtime events.
 * The broadcaster is null-safe: if the io instance is not yet set (e.g. during
 * tests), emit calls are silently dropped.
 *
 * Usage:
 *   import { broadcast } from "./realtime/broadcaster";
 *
 *   broadcast.toRestaurant(restaurantId, {
 *     type: RT.ORDER_CREATED,
 *     payload: { ... },
 *   });
 *
 * Scalability:
 *   When using the Redis adapter, `io.to(room).emit()` automatically fans out
 *   across all Node.js processes.  No changes needed here.
 */

import type { Server } from "socket.io";
import { nanoid } from "nanoid";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  SocketData,
  RealtimeEvent,
  PriceUpdatedPayload,
  FlashAlertPayload,
} from "../../src/realtime/types";
import { RT, rooms } from "../../src/realtime/types";

type IoServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  Record<string, never>,
  SocketData
>;

let io: IoServer | null = null;

export function setIoInstance(instance: IoServer): void {
  io = instance;
}

// ── Core emit helpers ──────────────────────────────────────────────────────────

function emitToRoom(room: string, event: RealtimeEvent): void {
  if (!io) return;
  io.to(room).emit("event", event);
}

// ── Public broadcast API ───────────────────────────────────────────────────────

export const broadcast = {
  /**
   * Emit to ALL sockets in a restaurant room (admin panel, cashier, TV).
   */
  toRestaurant(restaurantId: number, event: RealtimeEvent): void {
    emitToRoom(rooms.restaurant(restaurantId), event);
    // TV sockets are only in the :tv sub-room; also fan out there.
    emitToRoom(rooms.tv(restaurantId), event);
  },

  /**
   * Emit only to authenticated sockets (admin + cashier panels).
   * TV dashboards are excluded.
   */
  toStaff(restaurantId: number, event: RealtimeEvent): void {
    emitToRoom(rooms.restaurant(restaurantId), event);
  },

  /**
   * Emit to cashier-panel sockets only.
   */
  toCashier(restaurantId: number, event: RealtimeEvent): void {
    emitToRoom(rooms.cashier(restaurantId), event);
  },

  /**
   * Emit to TV dashboard sockets only.
   */
  toTv(restaurantId: number, event: RealtimeEvent): void {
    emitToRoom(rooms.tv(restaurantId), event);
  },

  /**
   * Emit to a specific branch room.
   */
  toBranch(restaurantId: number, branchId: number, event: RealtimeEvent): void {
    emitToRoom(rooms.branch(restaurantId, branchId), event);
  },
} as const;

// ── Convenience factory functions ──────────────────────────────────────────────
// These build well-typed events and emit them.  Call these from routers
// instead of constructing the raw event object manually.

export function emitOrderCreated(payload: RealtimeEvent["payload"] & { restaurantId: number }): void {
  const event: RealtimeEvent = { type: RT.ORDER_CREATED, payload: payload as any };
  broadcast.toRestaurant(payload.restaurantId, event);

  // Emit a flash alert for large orders (total > 500k UZS)
  const total = (payload as any).total ?? 0;
  if (total > 500_000) {
    emitFlashAlert(payload.restaurantId, {
      type: "order_spike",
      severity: "info",
      title: "Large Order",
      message: `New order ${(payload as any).orderNumber} — ${total.toLocaleString()} UZS`,
      value: total,
    });
  }
}

export function emitOrderUpdated(
  restaurantId: number,
  orderId: number,
  orderNumber: string,
  status: string,
): void {
  broadcast.toRestaurant(restaurantId, {
    type: RT.ORDER_UPDATED,
    payload: {
      restaurantId,
      orderId,
      orderNumber,
      status: status as any,
      updatedAt: new Date().toISOString(),
    },
  });
}

export function emitPriceUpdated(p: Omit<PriceUpdatedPayload, "direction" | "updatedAt">): void {
  const direction: "up" | "down" | "unchanged" =
    p.changePercent > 0 ? "up" : p.changePercent < 0 ? "down" : "unchanged";

  const payload: PriceUpdatedPayload = {
    ...p,
    direction,
    updatedAt: new Date().toISOString(),
  };

  broadcast.toRestaurant(p.restaurantId, { type: RT.PRICE_UPDATED, payload });

  // Emit a flash alert for significant price movements (>2%).
  if (Math.abs(p.changePercent) >= 2) {
    emitFlashAlert(p.restaurantId, {
      type: p.changePercent > 0 ? "price_surge" : "price_drop",
      severity: Math.abs(p.changePercent) >= 5 ? "warning" : "info",
      title: p.changePercent > 0 ? "Price Surge" : "Price Drop",
      message: `${p.productName} ${p.changePercent > 0 ? "↑" : "↓"} ${Math.abs(p.changePercent).toFixed(1)}%`,
      productId: p.productId,
      productName: p.productName,
      value: p.changePercent,
    });
  }
}

export function emitDemandChanged(
  restaurantId: number,
  productId: number,
  productName: string,
  emoji: string | undefined,
  heatScore: number,
  trend: string,
  velocity: number,
  hourlyOrders: number,
  dailyOrders: number,
): void {
  broadcast.toRestaurant(restaurantId, {
    type: RT.DEMAND_CHANGED,
    payload: {
      restaurantId,
      productId,
      productName,
      emoji,
      heatScore,
      trend: trend as any,
      velocity,
      hourlyOrders,
      dailyOrders,
      updatedAt: new Date().toISOString(),
    },
  });

  // Emit flash alerts at demand extremes.
  if (trend === "surging" && heatScore > 80) {
    emitFlashAlert(restaurantId, {
      type: "high_demand",
      severity: "warning",
      title: "Surging Demand",
      message: `${productName} demand is surging 🔥`,
      productId,
      productName,
      value: heatScore,
    });
  } else if (trend === "crashing" && heatScore < 15) {
    emitFlashAlert(restaurantId, {
      type: "low_demand",
      severity: "info",
      title: "Low Demand",
      message: `${productName} demand is crashing ❄️`,
      productId,
      productName,
      value: heatScore,
    });
  }
}

export function emitTrendingChanged(
  restaurantId: number,
  gainers: TrendingChangedPayload["gainers"],
  losers: TrendingChangedPayload["losers"],
): void {
  broadcast.toRestaurant(restaurantId, {
    type: RT.TRENDING_CHANGED,
    payload: {
      restaurantId,
      gainers,
      losers,
      updatedAt: new Date().toISOString(),
    },
  });
}

interface FlashAlertInput {
  type: FlashAlertPayload["type"];
  severity: FlashAlertPayload["severity"];
  title: string;
  message: string;
  productId?: number;
  productName?: string;
  value?: number;
}

function emitFlashAlert(restaurantId: number, alert: FlashAlertInput): void {
  broadcast.toRestaurant(restaurantId, {
    type: RT.FLASH_ALERT,
    payload: {
      restaurantId,
      id: nanoid(10),
      ...alert,
      createdAt: new Date().toISOString(),
    },
  });
}

// Re-export for convenience
import type { TrendingChangedPayload } from "../../src/realtime/types";
