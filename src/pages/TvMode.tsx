import React, { useEffect, useMemo } from "react";

import { motion } from "framer-motion";

import { useLiveProducts } from "@/hooks/useLiveProducts";

import { useI18n } from "@/providers/I18nProvider";

import { OrderTicker } from "@/components/trading/OrderTicker";

import { PriceChart } from "@/components/trading/PriceChart";

import { PriceFlowTicker } from "@/components/trading/PriceFlowTicker";

import { HeatmapGrid } from "@/components/trading/HeatmapGrid";

import { AiPredictionCard } from "@/components/trading/AiPredictionCard";

import { FlashAlertBanner } from "@/components/FlashAlertBanner";

import { MarketDisplayHeader } from "@/components/display/MarketDisplayHeader";

import { MarketPageShell } from "@/components/display/MarketPageShell";

import { LiveProductCard } from "@/components/display/LiveProductCard";

import { AiRecommendationTicker } from "@/components/display/AiRecommendationTicker";

import { PromotionCarousel } from "@/components/display/PromotionCarousel";

import { TopSellersPanel } from "@/components/display/TopSellersPanel";

import { DemandIndicatorPanel } from "@/components/display/DemandIndicatorPanel";



export function TvMode() {

  const { t, formatMoney } = useI18n();

  const {

    restaurant,

    snapshot,

    chartSeries,

    realtime,

    liveProducts,

    topSellers,

    promotions,

    heatmapItems,

    getSparkline,

  } = useLiveProducts();



  const accent = restaurant?.themeColor ?? "#00ff88";



  const activeProduct = liveProducts[0];

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



  useEffect(() => {

    const el = document.documentElement;

    el.classList.add("tv-fullscreen");

    return () => el.classList.remove("tv-fullscreen");

  }, []);



  return (

    <MarketPageShell

      fullscreen

      className="display-4k cyber-scanline bg-slate-950 text-white"

    >

      <MarketDisplayHeader

        restaurantName={restaurant?.name}

        logoUrl={restaurant?.logoUrl}

        bannerUrl={restaurant?.bannerUrl}

        themeColor={accent}

        subtitleKey="market.tvTitle"

        mode="tv"

        showNav={false}

        className="border-b border-emerald-500/30 bg-black/80 py-3 md:py-4 lg:py-5"

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



      <PriceFlowTicker

        changes={realtime.recentPriceChanges}

        formatMoney={formatMoney}

      />



      <FlashAlertBanner alerts={realtime.alerts} onDismiss={realtime.dismissAlert} />



      <motion.div

        layout

        className="market-scroll grid min-h-0 flex-1 grid-cols-1 gap-3 p-3 sm:gap-4 sm:p-4 lg:grid-cols-12 lg:gap-5 lg:p-6 xl:p-8"

      >

        <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-4">

          <PromotionCarousel products={promotions} accent={accent} intervalMs={7000} />

          <HeatmapGrid

            items={heatmapItems}

            formatMoney={formatMoney}

            liveHeat={liveHeat}

            surgeIds={surgeIds}

          />

        </div>



        <div className="flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-5">

          <div className="min-h-0 shrink-0">

            <PriceChart

              series={chartSeries.slice(0, 1)}

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

          </div>

          <motion.div className="market-product-grid min-h-0 flex-1">

            {liveProducts.map((p, i) => (

              <LiveProductCard

                key={p.productId}

                product={p}

                size="md"

                accent={accent}

                index={i}

                sparklineValues={getSparkline(p.legacyProductId, p.currentPrice)}

              />

            ))}

          </motion.div>

        </div>



        <div className="market-scroll flex min-h-0 min-w-0 flex-col gap-3 sm:gap-4 lg:col-span-3">

          <TopSellersPanel products={topSellers} formatMoney={formatMoney} compact />

          <DemandIndicatorPanel products={liveProducts} />

          <AiPredictionCard

            predictions={snapshot?.predictions ?? []}

            formatMoney={formatMoney}

          />

          <div className="min-w-0">

            <h3 className="mb-2 font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-400 sm:text-xs">

              {t("display.movers")}

            </h3>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-2">

              {realtime.gainers.slice(0, 4).map((g, i) => (

                <motion.div

                  key={g.productId}

                  animate={{ y: [0, -6, 0] }}

                  transition={{ repeat: Infinity, duration: 3, delay: i * 0.2 }}

                  className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-center sm:p-3"

                >

                  <p className="text-xl sm:text-2xl md:text-3xl">{g.emoji || "🍽️"}</p>

                  <p className="truncate text-[10px] font-bold sm:text-xs md:text-sm">

                    {g.productName}

                  </p>

                  <p className="font-mono text-xs text-emerald-400 sm:text-sm md:text-base">

                    +{g.changePercent.toFixed(1)}%

                  </p>

                </motion.div>

              ))}

            </div>

          </div>

        </div>

      </motion.div>



      <footer className="shrink-0 border-t border-emerald-500/20 py-2 text-center font-mono text-[9px] uppercase tracking-[0.35em] text-slate-600 sm:text-[10px] sm:tracking-[0.4em]">

        {t("market.poweredBy")}

      </footer>

    </MarketPageShell>

  );

}

