/**
 * api/realtime/types.ts
 *
 * Canonical event type definitions — imported by server AND client.
 * The contract never drifts because both sides share this one file.
 *
 * Scalability notes:
 *   - Every payload carries restaurantId for room-independent filtering.
 *   - ISO-8601 timestamps survive JSON serialisation cleanly.
 *   - trigger field lets the UI choose animation intensity.
 */

// ── Event name constants ───────────────────────────────────────────────────────

export const RT = {
  ORDER_CREATED:    "ORDER_CREATED",
  ORDER_UPDATED:    "ORDER_UPDATED",
  PRICE_UPDATED:    "PRICE_UPDATED",
  DEMAND_CHANGED:   "DEMAND_CHANGED",
  FLASH_ALERT:      "FLASH_ALERT",
  TRENDING_CHANGED: "TRENDING_CHANGED",
} as const;

export type RTEventName = (typeof RT)[keyof typeof RT];

// ── Payloads ───────────────────────────────────────────────────────────────────

export interface OrderCreatedPayload {
  restaurantId: number;
  branchId?: number;
  orderId: number;
  orderNumber: string;
  source: string;
  total: number;
  subtotal: number;
  tax: number;
  /** Optional freeform order-level notes or JSON string of item notes */
  notes?: string;
  tableNumber?: string;
  customerName?: string;
  items: Array<{
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  createdAt: string;
}

export interface OrderUpdatedPayload {
  restaurantId: number;
  orderId: number;
  orderNumber: string;
  status: "pending" | "confirmed" | "preparing" | "ready" | "served" | "cancelled";
  updatedAt: string;
}

export interface PriceUpdatedPayload {
  restaurantId: number;
  productId: number;
  productName: string;
  emoji?: string;
  oldPrice: number;
  newPrice: number;
  /** Signed percentage, e.g. 3.5 means +3.5% */
  changePercent: number;
  direction: "up" | "down" | "unchanged";
  trigger: "order" | "algorithm" | "manual" | "cancellation";
  updatedAt: string;
}

export interface DemandChangedPayload {
  restaurantId: number;
  productId: number;
  productName: string;
  emoji?: string;
  heatScore: number;
  trend: "surging" | "rising" | "stable" | "falling" | "crashing";
  velocity: number;
  hourlyOrders: number;
  dailyOrders: number;
  updatedAt: string;
}

export interface FlashAlertPayload {
  restaurantId: number;
  /** Client-side dedup key */
  id: string;
  type: "price_surge" | "price_drop" | "high_demand" | "low_demand" | "order_spike" | "system";
  severity: "info" | "warning" | "critical";
  title: string;
  message: string;
  productId?: number;
  productName?: string;
  value?: number;
  createdAt: string;
}

export interface TrendingChangedPayload {
  restaurantId: number;
  gainers: Array<{
    productId: number;
    productName: string;
    emoji?: string;
    changePercent: number;
    currentPrice: number;
  }>;
  losers: Array<{
    productId: number;
    productName: string;
    emoji?: string;
    changePercent: number;
    currentPrice: number;
  }>;
  updatedAt: string;
}

// ── Discriminated union ────────────────────────────────────────────────────────

export type RealtimeEvent =
  | { type: typeof RT.ORDER_CREATED;    payload: OrderCreatedPayload }
  | { type: typeof RT.ORDER_UPDATED;    payload: OrderUpdatedPayload }
  | { type: typeof RT.PRICE_UPDATED;    payload: PriceUpdatedPayload }
  | { type: typeof RT.DEMAND_CHANGED;   payload: DemandChangedPayload }
  | { type: typeof RT.FLASH_ALERT;      payload: FlashAlertPayload }
  | { type: typeof RT.TRENDING_CHANGED; payload: TrendingChangedPayload };

// ── Socket.io typed interface params ──────────────────────────────────────────

/** Events the server sends to clients. */
export interface ServerToClientEvents {
  event: (e: RealtimeEvent) => void;
  joined: (room: string) => void;
  pong: (ts: number) => void;
}

/** Events clients send to the server. */
export interface ClientToServerEvents {
  join_restaurant: (restaurantId: number, cb?: (room: string) => void) => void;
  join_branch: (restaurantId: number, branchId: number, cb?: (room: string) => void) => void;
  ping: (ts: number) => void;
}

/** Data stored on each socket connection. */
export interface SocketData {
  userId?: number;
  unionId?: string;
  userRole?: string;
  restaurantIds: number[];
  authenticated: boolean;
}

// ── Room name helpers ──────────────────────────────────────────────────────────

export const rooms = {
  restaurant: (id: number) => `restaurant:${id}`,
  branch:     (restaurantId: number, branchId: number) =>
                `restaurant:${restaurantId}:branch:${branchId}`,
  tv:         (restaurantId: number) => `restaurant:${restaurantId}:tv`,
  cashier:    (restaurantId: number) => `restaurant:${restaurantId}:cashier`,
} as const;
