import React, { useMemo, useState } from "react";
import { Activity, Radio } from "lucide-react";
import { motion } from "framer-motion";
import { FlashAlertBanner } from "@/components/FlashAlertBanner";
import { OrderTicker } from "@/components/trading/OrderTicker";
import { PriceChart } from "@/components/trading/PriceChart";
import { PriceFlowTicker } from "@/components/trading/PriceFlowTicker";
import { HeatmapGrid } from "@/components/trading/HeatmapGrid";
import { AiPredictionCard } from "@/components/trading/AiPredictionCard";
import { LiveProductCard } from "@/components/display/LiveProductCard";
import { AiRecommendationTicker } from "@/components/display/AiRecommendationTicker";
import { TopSellersPanel } from "@/components/display/TopSellersPanel";
import { DemandIndicatorPanel } from "@/components/display/DemandIndicatorPanel";
import { PeakHourPanel } from "@/components/display/PeakHourPanel";
import { MarketDisplayHeader } from "@/components/display/MarketDisplayHeader";
import { MarketPageShell } from "@/components/display/MarketPageShell";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useI18n } from "@/providers/I18nProvider";

export function Market() {
  const { t, formatMoney } = useI18n();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const {
    restaurant,
    snapshot,
    chartSeries,
    isLoading,
    realtime,
    liveProducts,
    topSellers,
    heatmapItems,
    peakHour,
    getSparkline,
  } = useLiveProducts(selectedId);

  const accent = restaurant?.themeColor ?? "#00ff88";

  const chartForProduct = useMemo(() => {
    if (chartSeries.length === 0) return [];
    if (!selectedId) return chartSeries.slice(0, 1);
    return chartSeries.filter((s) => s.productId === selectedId);
  }, [chartSeries, selectedId]);

  const activeProduct =
    liveProducts.find((p) => p.productId === selectedId) ?? liveProducts[0];

  const chartPrediction = snapshot?.predictions?.find(
    (p) => p.productId === activeProduct?.productId,
  );

  const liveHeat = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of liveProducts) {
      const d = realtime.demandMap.get(p.legacyProductId);
      if (d) m.set(p.productId, d.heatScore);
    }
    return m;
  }, [liveProducts, realtime.demandMap]);

  const surgeIds = useMemo(() => {
    const set = new Set<string>();
    for (const p of liveProducts) {
      const d = realtime.demandMap.get(p.legacyProductId);
      if (d && (d.trend === "surging" || d.trend === "rising")) {
        set.add(p.productId);
      }
    }
    return set;
  }, [liveProducts, realtime.demandMap]);

  const tickerOrders = realtime.orders.map((o) => ({
    orderId: o.orderId,
    orderNumber: o.orderNumber,
    total: (o as { total?: number }).total,
    status: o.status,
  }));

  return (
    <MarketPageShell className="display-4k">
      <MarketDisplayHeader
        restaurantName={restaurant?.name}
        logoUrl={restaurant?.logoUrl}
        themeColor={accent}
        titleKey="market.title"
        mode="market"
      />

      <div className="flex shrink-0 items-center justify-center gap-2 border-b border-emerald-500/10 bg-black/40 py-1">
        <Radio className="h-3 w-3 animate-pulse text-emerald-400" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-400/90">
          AI {t("market.pricingActive")} · WebSocket LIVE
        </span>
      </div>

      <AiRecommendationTicker
        items={snapshot?.recommendations ?? []}
        formatMoney={formatMoney}
      />

      <OrderTicker orders={tickerOrders} formatMoney={formatMoney} />

      <PriceFlowTicker
        changes={realtime.recentPriceChanges}
        formatMoney={formatMoney}
      />

      <FlashAlertBanner alerts={realtime.alerts} onDismiss={realtime.dismissAlert} />

      <div className="market-scroll flex-1 p-3 sm:p-4 md:p-6">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center gap-3 text-slate-500">
            <Activity className="h-6 w-6 animate-spin text-emerald-500" />
            {t("market.loading")}
          </div>
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 md:gap-4 xl:grid-cols-12">
            <div className="min-w-0 space-y-3 md:space-y-4 xl:col-span-3">
              <HeatmapGrid
                items={heatmapItems}
                formatMoney={formatMoney}
                selectedId={selectedId}
                onSelect={setSelectedId}
                liveHeat={liveHeat}
                surgeIds={surgeIds}
              />
              <DemandIndicatorPanel products={liveProducts} />
              <PeakHourPanel
                hour={peakHour.hour}
                label={peakHour.label as "now" | "forecast"}
                intensity={peakHour.intensity}
              />
            </div>

            <div className="min-w-0 space-y-3 md:space-y-4 xl:col-span-6">
              <PriceChart
                series={chartForProduct}
                accent={accent}
                formatMoney={formatMoney}
                legacyProductId={activeProduct?.legacyProductId}
                livePrice={
                  activeProduct
                    ? realtime.prices.get(activeProduct.legacyProductId)
                    : undefined
                }
                predictedChangePct={chartPrediction?.predictedChangePct}
                demandSurging={
                  activeProduct ? surgeIds.has(activeProduct.productId) : false
                }
              />

              <div>
                <h3 className="mb-3 font-mono text-xs font-bold uppercase tracking-wider text-slate-400">
                  {t("display.liveProducts")}
                </h3>
                <div className="market-product-grid">
                  {liveProducts.map((p, i) => (
                    <LiveProductCard
                      key={p.productId}
                      product={p}
                      size="md"
                      accent={accent}
                      index={i}
                      selected={selectedId === p.productId}
                      onClick={() => setSelectedId(p.productId)}
                      sparklineValues={getSparkline(p.legacyProductId, p.currentPrice)}
                    />
                  ))}
                </div>
              </div>
            </div>

            <motion.div className="min-w-0 space-y-3 md:space-y-4 xl:col-span-3" layout>
              <TopSellersPanel products={topSellers} formatMoney={formatMoney} />
              <AiPredictionCard
                predictions={snapshot?.predictions ?? []}
                formatMoney={formatMoney}
              />
            </motion.div>
          </div>
        )}
      </div>
    </MarketPageShell>
  );
}
