/**
 * src/hooks/useRealtimeMarket.ts
 *
 * Composite hook for the TV Dashboard.  Aggregates all realtime streams
 * into one convenient object:
 *
 *   - Live order feed     (ORDER_CREATED / ORDER_UPDATED)
 *   - Price ticker        (PRICE_UPDATED)
 *   - Demand map          (DEMAND_CHANGED)
 *   - Flash alerts        (FLASH_ALERT)
 *   - Trending products   (TRENDING_CHANGED)
 *   - Connection status
 *
 * The TV Dashboard imports ONLY this hook — it does not interact with
 * individual hooks or the socket directly.
 */

import { useState, useCallback } from "react";
import { useRealtime } from "./useRealtime";
import { useOrderFeed } from "./useOrderFeed";
import { usePriceTicker } from "./usePriceTicker";
import { useRealtimeContext } from "@/providers/RealtimeProvider";
import { RT } from "@/realtime/types";
import type {
  DemandChangedPayload,
  FlashAlertPayload,
  TrendingChangedPayload,
} from "@/realtime/types";

// ── Demand map ─────────────────────────────────────────────────────────────────

export interface DemandEntry {
  productId: number;
  productName: string;
  emoji?: string;
  heatScore: number;
  trend: string;
  velocity: number;
  hourlyOrders: number;
  dailyOrders: number;
  lastUpdated: string;
}

// ── Flash alerts (ring-buffer) ─────────────────────────────────────────────────

export interface LiveAlert extends FlashAlertPayload {
  /** True until dismissed or TTL expires */
  visible: boolean;
}

const ALERT_TTL = 8_000; // 8 seconds before auto-dismiss
const MAX_ALERTS = 5;

// ── Return type ────────────────────────────────────────────────────────────────

export interface RealtimeMarketData {
  // Connection
  isConnected: boolean;
  isConnecting: boolean;
  latencyMs: number | null;
  reconnectAttempt: number;

  // Orders
  orders: ReturnType<typeof useOrderFeed>["orders"];
  newOrderCount: number;
  resetNewOrderCount: () => void;

  // Prices
  prices: ReturnType<typeof usePriceTicker>["prices"];
  flashingIds: ReturnType<typeof usePriceTicker>["flashingIds"];
  recentPriceChanges: ReturnType<typeof usePriceTicker>["recentChanges"];
  totalPriceChangeCount: number;

  // Demand
  demandMap: Map<number, DemandEntry>;

  // Alerts
  alerts: LiveAlert[];
  dismissAlert: (id: string) => void;

  // Trending
  gainers: TrendingChangedPayload["gainers"];
  losers: TrendingChangedPayload["losers"];
}

// ── Hook ───────────────────────────────────────────────────────────────────────

export function useRealtimeMarket(restaurantId: number): RealtimeMarketData {
  const { isConnected, isConnecting, latencyMs, reconnectAttempt } =
    useRealtimeContext();

  const { orders, newOrderCount, resetNewOrderCount } = useOrderFeed({
    restaurantId,
    maxOrders: 30,
  });

  const { prices, flashingIds, recentChanges, totalChangeCount } =
    usePriceTicker({ restaurantId });

  const [demandMap, setDemandMap] = useState<Map<number, DemandEntry>>(new Map());
  const [alerts, setAlerts] = useState<LiveAlert[]>([]);
  const [gainers, setGainers] = useState<TrendingChangedPayload["gainers"]>([]);
  const [losers, setLosers] = useState<TrendingChangedPayload["losers"]>([]);

  // ── DEMAND_CHANGED ──────────────────────────────────────────────────────────

  useRealtime(
    RT.DEMAND_CHANGED,
    useCallback(
      (payload: DemandChangedPayload) => {
        if (payload.restaurantId !== restaurantId) return;

        setDemandMap((prev) => {
          const next = new Map(prev);
          next.set(payload.productId, {
            productId: payload.productId,
            productName: payload.productName,
            emoji: payload.emoji,
            heatScore: payload.heatScore,
            trend: payload.trend,
            velocity: payload.velocity,
            hourlyOrders: payload.hourlyOrders,
            dailyOrders: payload.dailyOrders,
            lastUpdated: payload.updatedAt,
          });
          return next;
        });
      },
      [restaurantId],
    ),
  );

  // ── FLASH_ALERT ─────────────────────────────────────────────────────────────

  useRealtime(
    RT.FLASH_ALERT,
    useCallback(
      (payload: FlashAlertPayload) => {
        if (payload.restaurantId !== restaurantId) return;

        const alert: LiveAlert = { ...payload, visible: true };

        setAlerts((prev) => [alert, ...prev].slice(0, MAX_ALERTS));

        // Auto-dismiss after TTL.
        setTimeout(() => {
          setAlerts((prev) =>
            prev.map((a) => (a.id === payload.id ? { ...a, visible: false } : a)),
          );
        }, ALERT_TTL);
      },
      [restaurantId],
    ),
  );

  const dismissAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, visible: false } : a)),
    );
  }, []);

  // ── TRENDING_CHANGED ────────────────────────────────────────────────────────

  useRealtime(
    RT.TRENDING_CHANGED,
    useCallback(
      (payload: TrendingChangedPayload) => {
        if (payload.restaurantId !== restaurantId) return;
        setGainers(payload.gainers);
        setLosers(payload.losers);
      },
      [restaurantId],
    ),
  );

  return {
    isConnected,
    isConnecting,
    latencyMs,
    reconnectAttempt,
    orders,
    newOrderCount,
    resetNewOrderCount,
    prices,
    flashingIds,
    recentPriceChanges: recentChanges,
    totalPriceChangeCount: totalChangeCount,
    demandMap,
    alerts,
    dismissAlert,
    gainers,
    losers,
  };
}
