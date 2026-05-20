import { useCallback, useEffect, useState } from "react";
import { useRealtime } from "./useRealtime";
import { RT } from "@/realtime/types";
import type { PriceUpdatedPayload } from "@/realtime/types";

const MAX_POINTS = 28;

type SeedProduct = {
  legacyProductId: number;
  currentPrice: number;
  basePrice: number;
};

export function useProductSparklines(
  products: SeedProduct[],
  restaurantId: number,
) {
  const [series, setSeries] = useState<Map<number, number[]>>(new Map());

  useEffect(() => {
    setSeries((prev) => {
      const next = new Map(prev);
      let changed = false;

      for (const p of products) {
        const existing = next.get(p.legacyProductId);
        if (!existing || existing.length < 2) {
          const seed = generateSeedPrices(p.basePrice, p.currentPrice);
          next.set(p.legacyProductId, seed);
          changed = true;
        } else if (existing[existing.length - 1] !== p.currentPrice) {
          const updated = [...existing];
          updated[updated.length - 1] = p.currentPrice;
          next.set(p.legacyProductId, updated);
          changed = true;
        }
      }

      return changed ? next : prev;
    });
  }, [products]);

  useRealtime(
    RT.PRICE_UPDATED,
    useCallback(
      (payload: PriceUpdatedPayload) => {
        if (payload.restaurantId !== restaurantId) return;
        setSeries((prev) => {
          const next = new Map(prev);
          const cur = next.get(payload.productId) ?? [
            payload.oldPrice,
            payload.newPrice,
          ];
          const merged = [...cur, payload.newPrice].slice(-MAX_POINTS);
          next.set(payload.productId, merged);
          return next;
        });
      },
      [restaurantId],
    ),
  );

  const getSparkline = useCallback(
    (legacyProductId: number, fallbackPrice?: number) => {
      const data = series.get(legacyProductId);
      if (data && data.length >= 2) return data;
      if (fallbackPrice != null) {
        return generateSeedPrices(fallbackPrice * 0.98, fallbackPrice);
      }
      return [];
    },
    [series],
  );

  return { getSparkline, series };
}

function generateSeedPrices(base: number, current: number): number[] {
  const steps = 12;
  const out: number[] = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const wobble = Math.sin(i * 1.7) * base * 0.008;
    out.push(base + (current - base) * t + wobble);
  }
  return out;
}
