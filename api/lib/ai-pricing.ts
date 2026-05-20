import { prisma } from "../prisma-client";
import {
  emitDemandChanged,
  emitPriceUpdated,
  emitTrendingChanged,
} from "../realtime/broadcaster";
import { productIdHash } from "./product-id-hash";

type ProductRow = {
  id: string;
  name: string;
  emoji: string | null;
  basePrice: number;
  currentPrice: number;
  minPrice: number;
  maxPrice: number;
  stockQuantity: number;
  aiEnabled: boolean;
  isHot: boolean;
};

function clamp(price: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.round(price)));
}

function changePercent(oldP: number, newP: number) {
  if (oldP === 0) return 0;
  return ((newP - oldP) / oldP) * 100;
}

function demandTrend(heat: number): "surging" | "rising" | "stable" | "falling" | "crashing" {
  if (heat >= 85) return "surging";
  if (heat >= 60) return "rising";
  if (heat >= 35) return "stable";
  if (heat >= 15) return "falling";
  return "crashing";
}

async function recordPrice(productId: string, price: number, reason: string) {
  await prisma.priceHistory.create({
    data: { productId, price, reason },
  });
}

export async function applyOrderDemandBoost(
  restaurantLegacyId: number,
  product: ProductRow,
  quantity: number,
) {
  if (!product.aiEnabled) return;

  const stockFactor = product.stockQuantity <= 3 ? 1.8 : product.stockQuantity <= 8 ? 1.2 : 1;
  const bump = 0.4 + quantity * 0.35 * stockFactor;
  const oldPrice = product.currentPrice;
  const newPrice = clamp(oldPrice * (1 + bump / 100), product.minPrice, product.maxPrice);

  if (newPrice === oldPrice) return;

  await prisma.product.update({
    where: { id: product.id },
    data: { currentPrice: newPrice, isHot: true },
  });
  await recordPrice(product.id, newPrice, "order");

  const pid = productIdHash(product.id);
  const pct = changePercent(oldPrice, newPrice);

  emitPriceUpdated({
    restaurantId: restaurantLegacyId,
    productId: pid,
    productName: product.name,
    emoji: product.emoji ?? undefined,
    oldPrice,
    newPrice,
    changePercent: pct,
    trigger: "order",
  });

  const heat = Math.min(99, 40 + quantity * 12 + (product.isHot ? 15 : 0));
  emitDemandChanged(
    restaurantLegacyId,
    pid,
    product.name,
    product.emoji ?? undefined,
    heat,
    demandTrend(heat),
    bump,
    quantity,
    quantity * 4,
  );
}

export async function runAiPricingTick(restaurantId: string, restaurantLegacyId: number) {
  const products = await prisma.product.findMany({
    where: { restaurantId, aiEnabled: true, isAvailable: true },
  });

  if (products.length === 0) return;

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recentItems = await prisma.orderItem.findMany({
    where: {
      order: { restaurantId, createdAt: { gte: hourAgo }, status: { not: "CANCELLED" } },
    },
    select: { productId: true, quantity: true },
  });

  const orderCounts = new Map<string, number>();
  for (const item of recentItems) {
    orderCounts.set(item.productId, (orderCounts.get(item.productId) ?? 0) + item.quantity);
  }

  const changes: Array<{ id: string; old: number; neu: number; pct: number }> = [];

  for (const p of products) {
    const hourly = orderCounts.get(p.id) ?? 0;
    const volatility = 0.3 + Math.random() * 1.4;
    const demandSignal = (hourly - 2) * 0.15;
    const stockSignal = p.stockQuantity <= 5 ? 0.8 : p.stockQuantity > 20 ? -0.3 : 0;
    const meanRevert = (p.basePrice - p.currentPrice) / p.basePrice * 0.25;
    const deltaPct = demandSignal + stockSignal + meanRevert + (Math.random() - 0.5) * volatility;

    const oldPrice = p.currentPrice;
    const newPrice = clamp(oldPrice * (1 + deltaPct / 100), p.minPrice, p.maxPrice);
    if (newPrice === oldPrice) continue;

    await prisma.product.update({
      where: { id: p.id },
      data: {
        currentPrice: newPrice,
        isHot: deltaPct > 0.5,
      },
    });
    await recordPrice(p.id, newPrice, "algorithm");

    const pid = productIdHash(p.id);
    const pct = changePercent(oldPrice, newPrice);
    changes.push({ id: p.id, old: oldPrice, neu: newPrice, pct });

    emitPriceUpdated({
      restaurantId: restaurantLegacyId,
      productId: pid,
      productName: p.name,
      emoji: p.emoji ?? undefined,
      oldPrice,
      newPrice,
      changePercent: pct,
      trigger: "algorithm",
    });

    const heat = Math.min(
      99,
      Math.max(5, 30 + hourly * 8 + (deltaPct > 0 ? 15 : -10) + (p.isHot ? 10 : 0)),
    );
    emitDemandChanged(
      restaurantLegacyId,
      pid,
      p.name,
      p.emoji ?? undefined,
      heat,
      demandTrend(heat),
      deltaPct,
      hourly,
      hourly * 6,
    );
  }

  if (changes.length >= 2) {
    const sorted = [...changes].sort((a, b) => b.pct - a.pct);
    const gainers = sorted.slice(0, 5).map((c) => {
      const prod = products.find((x) => x.id === c.id)!;
      return {
        productId: productIdHash(c.id),
        productName: prod.name,
        emoji: prod.emoji ?? undefined,
        changePercent: c.pct,
        currentPrice: c.neu,
      };
    });
    const losers = [...changes]
      .sort((a, b) => a.pct - b.pct)
      .slice(0, 5)
      .map((c) => {
        const prod = products.find((x) => x.id === c.id)!;
        return {
          productId: productIdHash(c.id),
          productName: prod.name,
          emoji: prod.emoji ?? undefined,
          changePercent: c.pct,
          currentPrice: c.neu,
        };
      });
    emitTrendingChanged(restaurantLegacyId, gainers, losers);
  }
}

export function buildPredictions(
  products: Array<{
    id: string;
    name: string;
    emoji: string | null;
    currentPrice: number;
    basePrice: number;
    isHot: boolean;
    stockQuantity: number;
  }>,
  hourlyOrders: Map<string, number>,
) {
  return products
    .map((p) => {
      const hourly = hourlyOrders.get(p.id) ?? 0;
      const momentum = (p.currentPrice - p.basePrice) / p.basePrice;
      const predictedChange = momentum * 40 + hourly * 1.2 - (p.stockQuantity < 5 ? -2 : 0);
      const confidence = Math.min(95, 55 + hourly * 5 + (p.isHot ? 12 : 0));
      return {
        productId: p.id,
        productName: p.name,
        emoji: p.emoji,
        currentPrice: p.currentPrice,
        predictedChangePct: Math.round(predictedChange * 10) / 10,
        confidence: Math.round(confidence),
        signal: predictedChange > 1.5 ? "bullish" : predictedChange < -1 ? "bearish" : "neutral",
        horizon: "1h",
      };
    })
    .sort((a, b) => Math.abs(b.predictedChangePct) - Math.abs(a.predictedChangePct))
    .slice(0, 8);
}

export function buildRecommendations(
  products: Array<{
    id: string;
    name: string;
    emoji: string | null;
    currentPrice: number;
    isHot: boolean;
    stockQuantity: number;
    imageUrl: string | null;
  }>,
  heatmap: Map<string, number>,
) {
  return products
    .map((p) => ({
      productId: p.id,
      name: p.name,
      emoji: p.emoji,
      imageUrl: p.imageUrl,
      price: p.currentPrice,
      heat: heatmap.get(p.id) ?? (p.isHot ? 70 : 40),
      reason:
        p.stockQuantity <= 5
          ? "low_stock_surge"
          : p.isHot
            ? "trending_up"
            : "value_pick",
      score: (heatmap.get(p.id) ?? 40) + (p.isHot ? 20 : 0) - p.stockQuantity * 0.5,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}
