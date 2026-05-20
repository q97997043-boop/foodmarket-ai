/**
 * src/hooks/usePriceTicker.ts
 *
 * Tracks price movements in real time.
 *
 * Returns:
 *   - `prices`      — Map of productId → latest price data
 *   - `flashingIds` — Set of productIds currently in flash animation
 *   - `recentChanges` — Ring-buffer of the last N price events (for the ticker)
 *
 * Flash lifecycle:
 *   When a PRICE_UPDATED event arrives:
 *   1. productId is added to flashingIds
 *   2. The price entry is updated
 *   3. After `flashDurationMs`, productId is removed from flashingIds
 *
 * The CSS flash colour is determined by `direction`:
 *   "up"   → flash green (#10B981)
 *   "down" → flash red  (#EF4444)
 */

import { useState, useCallback } from "react";
import { useRealtime } from "./useRealtime";
import { RT } from "@/realtime/types";
import type { PriceUpdatedPayload } from "@/realtime/types";

export interface PriceEntry {
  productId: number;
  productName: string;
  emoji?: string;
  currentPrice: number;
  previousPrice: number;
  changePercent: number;
  direction: "up" | "down" | "unchanged";
  trigger: string;
  lastUpdated: string;
}

interface UsePriceTickerOptions {
  restaurantId: number;
  maxHistory?: number;
  flashDurationMs?: number;
}

interface UsePriceTickerReturn {
  prices: Map<number, PriceEntry>;
  flashingIds: Set<number>;
  /** Sorted newest-first, length capped at maxHistory */
  recentChanges: PriceEntry[];
  totalChangeCount: number;
}

export function usePriceTicker({
  restaurantId,
  maxHistory = 30,
  flashDurationMs = 2_000,
}: UsePriceTickerOptions): UsePriceTickerReturn {
  const [prices, setPrices] = useState<Map<number, PriceEntry>>(new Map());
  const [flashingIds, setFlashingIds] = useState<Set<number>>(new Set());
  const [recentChanges, setRecentChanges] = useState<PriceEntry[]>([]);
  const [totalChangeCount, setTotalChangeCount] = useState(0);

  useRealtime(
    RT.PRICE_UPDATED,
    useCallback(
      (payload: PriceUpdatedPayload) => {
        if (payload.restaurantId !== restaurantId) return;

        const entry: PriceEntry = {
          productId: payload.productId,
          productName: payload.productName,
          emoji: payload.emoji,
          currentPrice: payload.newPrice,
          previousPrice: payload.oldPrice,
          changePercent: payload.changePercent,
          direction: payload.direction,
          trigger: payload.trigger,
          lastUpdated: payload.updatedAt,
        };

        // Update the prices map.
        setPrices((prev) => new Map(prev).set(payload.productId, entry));

        // Add to recent changes ring-buffer.
        setRecentChanges((prev) => [entry, ...prev].slice(0, maxHistory));

        setTotalChangeCount((c) => c + 1);

        // Flash animation.
        setFlashingIds((prev) => new Set(prev).add(payload.productId));
        setTimeout(() => {
          setFlashingIds((prev) => {
            const next = new Set(prev);
            next.delete(payload.productId);
            return next;
          });
        }, flashDurationMs);
      },
      [restaurantId, maxHistory, flashDurationMs],
    ),
  );

  return { prices, flashingIds, recentChanges, totalChangeCount };
}
