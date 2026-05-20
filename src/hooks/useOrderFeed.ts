/**
 * src/hooks/useOrderFeed.ts
 *
 * Maintains a live ring-buffer of recent orders for the TV dashboard
 * and cashier panel.
 *
 * Behaviour:
 *   - Initialised from the tRPC `order.getRecent` query (snapshot).
 *   - Prepends new orders as ORDER_CREATED events arrive.
 *   - Updates order status in-place when ORDER_UPDATED events arrive.
 *   - Caps the list at `maxOrders` to avoid unbounded memory growth.
 *   - New orders flash for `flashDurationMs` then settle.
 */

import { useState, useCallback } from "react";
import { useRealtime } from "./useRealtime";
import { RT } from "@/realtime/types";
import type { OrderCreatedPayload, OrderUpdatedPayload } from "@/realtime/types";

export interface LiveOrder {
  orderId: number;
  orderNumber: string;
  status: string;
  total: number;
  source: string;
  tableNumber?: string;
  customerName?: string;
  items: OrderCreatedPayload["items"];
  createdAt: string;
  /** True for `flashDurationMs` after arrival — drives CSS flash animation. */
  isNew: boolean;
}

interface UseOrderFeedOptions {
  restaurantId: number;
  maxOrders?: number;
  flashDurationMs?: number;
  initialOrders?: LiveOrder[];
}

interface UseOrderFeedReturn {
  orders: LiveOrder[];
  newOrderCount: number;
  resetNewOrderCount: () => void;
}

export function useOrderFeed({
  restaurantId,
  maxOrders = 50,
  flashDurationMs = 3_000,
  initialOrders = [],
}: UseOrderFeedOptions): UseOrderFeedReturn {
  const [orders, setOrders] = useState<LiveOrder[]>(initialOrders);
  const [newOrderCount, setNewOrderCount] = useState(0);

  // ── ORDER_CREATED ──────────────────────────────────────────────────────────

  useRealtime(
    RT.ORDER_CREATED,
    useCallback(
      (payload: OrderCreatedPayload) => {
        if (payload.restaurantId !== restaurantId) return;

        const newOrder: LiveOrder = {
          orderId: payload.orderId,
          orderNumber: payload.orderNumber,
          status: "confirmed",
          total: payload.total,
          source: payload.source,
          tableNumber: payload.tableNumber,
          customerName: payload.customerName,
          items: payload.items,
          createdAt: payload.createdAt,
          isNew: true,
        };

        setOrders((prev) => [newOrder, ...prev].slice(0, maxOrders));
        setNewOrderCount((c) => c + 1);

        // Clear the isNew flag after the flash duration.
        setTimeout(() => {
          setOrders((prev) =>
            prev.map((o) =>
              o.orderId === payload.orderId ? { ...o, isNew: false } : o,
            ),
          );
        }, flashDurationMs);
      },
      [restaurantId, maxOrders, flashDurationMs],
    ),
  );

  // ── ORDER_UPDATED ──────────────────────────────────────────────────────────

  useRealtime(
    RT.ORDER_UPDATED,
    useCallback(
      (payload: OrderUpdatedPayload) => {
        if (payload.restaurantId !== restaurantId) return;

        setOrders((prev) =>
          prev.map((o) =>
            o.orderId === payload.orderId ? { ...o, status: payload.status } : o,
          ),
        );
      },
      [restaurantId],
    ),
  );

  // Auto-remove orders that are marked 'served' after a short timeout so TV/Queue
  // screens don't become cluttered.
  useRealtime(
    RT.ORDER_UPDATED,
    useCallback(
      (payload: OrderUpdatedPayload) => {
        if (payload.restaurantId !== restaurantId) return;
        if (payload.status === "served") {
          // remove after 15s
          setTimeout(() => {
            setOrders((prev) => prev.filter((o) => o.orderId !== payload.orderId));
          }, 15_000);
        }
      },
      [restaurantId],
    ),
  );

  const resetNewOrderCount = useCallback(() => setNewOrderCount(0), []);

  return { orders, newOrderCount, resetNewOrderCount };
}
