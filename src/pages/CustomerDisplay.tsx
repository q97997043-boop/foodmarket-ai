import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { useRealtimeMarket } from "@/hooks/useRealtimeMarket";
import { useRestaurant } from "@/providers/RestaurantProvider";
import { useLiveProducts } from "@/hooks/useLiveProducts";
import { useI18n } from "@/providers/I18nProvider";
import { OrderTicker } from "@/components/trading/OrderTicker";
import { AiRecommendationTicker } from "@/components/display/AiRecommendationTicker";
import { LiveProductCard } from "@/components/display/LiveProductCard";
import { PromotionCarousel } from "@/components/display/PromotionCarousel";
import { TopSellersPanel } from "@/components/display/TopSellersPanel";
import { MarketDisplayHeader } from "@/components/display/MarketDisplayHeader";
import { MarketPageShell } from "@/components/display/MarketPageShell";
import { PeakHourPanel } from "@/components/display/PeakHourPanel";

export function CustomerDisplay() {
  const { t, formatMoney } = useI18n();
  const {
    restaurant,
    snapshot,
    realtime,
    liveProducts,
    topSellers,
    promotions,
    peakHour,
    getSparkline,
  } = useLiveProducts();

  const { legacyId } = useRestaurant();
  const { orders: liveOrders } = useRealtimeMarket(legacyId);
  const readyOrders = liveOrders.filter((o) => o.status === "ready");

  const accent = restaurant?.themeColor ?? "#00ff88";

  useEffect(() => {
    document.documentElement.classList.add("tv-fullscreen");
    return () => document.documentElement.classList.remove("tv-fullscreen");
  }, []);

  return (
    <MarketPageShell fullscreen className="display-4k bg-slate-950 text-white">
      <motion.div
        className="flex min-h-0 flex-1 flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        {readyOrders.length > 0 && (
          <motion.div
            initial={{ y: -40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 160 }}
            className="pointer-events-none fixed left-1/2 top-8 z-50 -translate-x-1/2 rounded-xl bg-emerald-500/10 px-6 py-3 text-center shadow-lg"
          >
            <div className="text-2xl font-bold text-emerald-300 drop-shadow">ORDER READY</div>
            <div className="mt-1 text-sm text-emerald-200">
              {readyOrders.map((o) => `#${o.orderNumber}`).join(" • ")}
            </div>
          </motion.div>
        )}
        <MarketDisplayHeader
          restaurantName={restaurant?.name}
          logoUrl={restaurant?.logoUrl}
          themeColor={accent}
          subtitleKey="market.customerWelcome"
          mode="display"
          className="border-b border-emerald-500/20 bg-black/70 py-4 md:py-5 lg:py-6"
        />

        <AiRecommendationTicker
          items={snapshot?.recommendations ?? []}
          formatMoney={formatMoney}
        />

        <OrderTicker
          orders={realtime.orders.map((o) => ({
            orderId: o.orderId,
            orderNumber: o.orderNumber,
            status: o.status,
          }))}
          formatMoney={formatMoney}
        />

        <main className="market-scroll flex-1 p-3 sm:p-6 md:p-8 lg:p-10">
          <motion.div
            layout
            className="mx-auto grid w-full max-w-[2560px] min-w-0 grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-12 xl:gap-8"
          >
            <div className="min-w-0 xl:col-span-8">
              <motion.h2
                className="mb-3 text-center font-mono text-xs uppercase tracking-[0.3em] text-cyan-400 sm:mb-4 sm:text-sm md:text-base md:tracking-[0.35em]"
                animate={{ opacity: [0.7, 1, 0.7] }}
                transition={{ repeat: Infinity, duration: 3 }}
              >
                {t("market.trendingNow")}
              </motion.h2>
              <div className="market-product-grid mb-6 sm:mb-8">
                {liveProducts.map((p, i) => (
                  <LiveProductCard
                    key={p.productId}
                    product={p}
                    size="lg"
                    accent={accent}
                    index={i}
                    sparklineValues={getSparkline(p.legacyProductId, p.currentPrice)}
                  />
                ))}
              </div>
              <PromotionCarousel products={promotions} accent={accent} intervalMs={8000} />
            </div>

            <div className="min-w-0 space-y-3 sm:space-y-4 xl:col-span-4">
              <TopSellersPanel products={topSellers} formatMoney={formatMoney} />
              <PeakHourPanel
                hour={peakHour.hour}
                label={peakHour.label as "now" | "forecast"}
                intensity={peakHour.intensity}
              />
            </div>
          </motion.div>
        </main>

        <footer className="shrink-0 border-t border-slate-800 py-3 text-center font-mono text-[10px] text-slate-500 sm:py-4 sm:text-xs">
          {t("market.poweredBy")}
        </footer>
      </motion.div>
    </MarketPageShell>
  );
}
