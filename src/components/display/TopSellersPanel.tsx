import React from "react";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { GlowCard } from "@/components/trading/GlowCard";
import { resolveImageSrc } from "@/lib/media";
import { useI18n } from "@/providers/I18nProvider";
import type { LiveProduct } from "@/hooks/useLiveProducts";

type TopSellersPanelProps = {
  products: LiveProduct[];
  formatMoney: (n: number) => string;
  compact?: boolean;
};

export function TopSellersPanel({
  products,
  formatMoney,
  compact,
}: TopSellersPanelProps) {
  const { t } = useI18n();

  return (
    <GlowCard delay={0.08} className="h-full">
      <div className="mb-3 flex items-center gap-2">
        <Trophy className="h-5 w-5 text-amber-400" />
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-400">
          {t("display.topSellers")}
        </h3>
      </div>
      <ol className="space-y-2">
        {products.map((p, i) => {
          const img = resolveImageSrc(p.imageUrl);
          return (
            <motion.li
              key={p.productId}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-xl border border-slate-800/80 bg-slate-950/60 p-2"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-500/15 font-mono text-xs font-bold text-amber-400">
                {i + 1}
              </span>
              {img ? (
                <img src={img} alt="" className="h-10 w-10 shrink-0 rounded-lg object-cover" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-800 text-xl">
                  {p.emoji || "🍽️"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-white">{p.name}</p>
                {!compact && (
                  <p className="font-mono text-[10px] text-slate-500">
                    {t("display.ordersLive")}: {p.liveOrders}
                  </p>
                )}
              </div>
              <span className="font-mono text-sm font-bold text-emerald-400">
                {formatMoney(p.currentPrice)}
              </span>
            </motion.li>
          );
        })}
        {products.length === 0 && (
          <p className="py-8 text-center text-sm text-slate-500">{t("market.tickerWaiting")}</p>
        )}
      </ol>
    </GlowCard>
  );
}
