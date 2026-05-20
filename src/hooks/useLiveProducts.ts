import { useMemo } from "react";
import { useMarketData } from "./useMarketData";
import { useProductSparklines } from "./useProductSparklines";

export type LiveProduct = {
  productId: string;
  legacyProductId: number;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  category: string | null;
  currentPrice: number;
  basePrice: number;
  changePercent: number;
  direction: "up" | "down" | "unchanged";
  isFlashing: boolean;
  heat: number;
  hourlyOrders: number;
  liveOrders: number;
  isHot: boolean;
  isTrending: boolean;
  aiSignal: "bullish" | "bearish" | "neutral" | null;
  aiConfidence: number;
  popularity: number;
};

export function useLiveProducts(selectedProductId?: string | null) {
  const data = useMarketData(selectedProductId);

  const liveProducts = useMemo((): LiveProduct[] => {
    const products = data.snapshot?.products ?? [];
    const predictions = new Map(
      (data.snapshot?.predictions ?? []).map((p) => [p.productId, p]),
    );
    const trendingIds = new Set(
      data.realtime.gainers.map((g) => g.productId),
    );

    return products.map((p) => {
      const live = data.realtime.prices.get(p.legacyProductId);
      const demand = data.realtime.demandMap.get(p.legacyProductId);
      const pred = predictions.get(p.productId);

      const changePercent = live?.changePercent ?? p.changePercent;
      const direction = live?.direction ?? "unchanged";

      return {
        productId: p.productId,
        legacyProductId: p.legacyProductId,
        name: p.name,
        emoji: p.emoji,
        imageUrl: p.imageUrl,
        category: p.category ?? null,
        currentPrice: live?.currentPrice ?? p.currentPrice,
        basePrice: p.basePrice,
        changePercent,
        direction,
        isFlashing: data.realtime.flashingIds.has(p.legacyProductId),
        heat: demand?.heatScore ?? p.heat,
        hourlyOrders: demand?.hourlyOrders ?? p.hourlyOrders,
        liveOrders: demand?.hourlyOrders ?? p.hourlyOrders,
        isHot: p.isHot,
        isTrending: trendingIds.has(p.legacyProductId) || p.heat >= 65,
        aiSignal:
          (pred?.signal as LiveProduct["aiSignal"]) ??
          (changePercent > 1 ? "bullish" : changePercent < -1 ? "bearish" : "neutral"),
        aiConfidence: pred?.confidence ?? 50,
        popularity: Math.round(demand?.heatScore ?? p.heat),
      };
    });
  }, [data.snapshot, data.realtime]);

  const topSellers = useMemo(
    () =>
      [...liveProducts]
        .sort((a, b) => b.hourlyOrders - a.hourlyOrders || b.heat - a.heat)
        .slice(0, 6),
    [liveProducts],
  );

  const promotions = useMemo(() => {
    const hot = liveProducts.filter((p) => p.isHot || p.isTrending);
    const pool = hot.length >= 3 ? hot : liveProducts;
    return pool.slice(0, 8);
  }, [liveProducts]);

  const sparklineSeeds = useMemo(
    () =>
      liveProducts.map((p) => ({
        legacyProductId: p.legacyProductId,
        currentPrice: p.currentPrice,
        basePrice: p.basePrice,
      })),
    [liveProducts],
  );

  const { getSparkline } = useProductSparklines(
    sparklineSeeds,
    data.legacyId,
  );

  const peakHour = useMemo(() => {
    const total = liveProducts.reduce((s, p) => s + p.hourlyOrders, 0);
    const hour = new Date().getHours();
    if (total >= 15) {
      return { hour: hour, label: "now", intensity: Math.min(100, total * 4) };
    }
    const peak = (hour + 2) % 24;
    return {
      hour: peak,
      label: "forecast",
      intensity: Math.min(85, 40 + liveProducts.length * 5),
    };
  }, [liveProducts]);

  return {
    ...data,
    liveProducts,
    topSellers,
    promotions,
    peakHour,
    getSparkline,
    heatmapItems: liveProducts.map((p) => ({
      productId: p.productId,
      name: p.name,
      emoji: p.emoji,
      heat: p.heat,
      currentPrice: p.currentPrice,
      changePercent: p.changePercent,
      isHot: p.isHot,
    })),
  };
}
