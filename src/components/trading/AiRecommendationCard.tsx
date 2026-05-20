import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { GlowCard } from "./GlowCard";
import { useI18n } from "@/providers/I18nProvider";
import { resolveImageSrc } from "@/lib/media";

export type Recommendation = {
  productId: string;
  name: string;
  emoji: string | null;
  imageUrl: string | null;
  price: number;
  heat: number;
  reason: string;
};

type AiRecommendationCardProps = {
  items: Recommendation[];
  formatMoney: (n: number) => string;
};

const reasonKey: Record<string, string> = {
  low_stock_surge: "market.reasonLowStock",
  trending_up: "market.reasonTrending",
  value_pick: "market.reasonValue",
};

export function AiRecommendationCard({ items, formatMoney }: AiRecommendationCardProps) {
  const { t } = useI18n();

  return (
    <GlowCard delay={0.2}>
      <div className="mb-3 flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-amber-400" />
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-amber-400">
          {t("market.aiRecommendations")}
        </h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {items.map((item, i) => (
          <motion.div
            key={item.productId}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="cyber-glow-card flex gap-3 rounded-xl border border-amber-500/20 bg-slate-950/50 p-3"
          >
            {resolveImageSrc(item.imageUrl) ? (
              <img
                src={resolveImageSrc(item.imageUrl)}
                alt=""
                className="h-14 w-14 shrink-0 rounded-lg object-cover"
              />
            ) : (
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-slate-900 text-2xl">
                {item.emoji || "🍽️"}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate font-semibold text-white">{item.name}</p>
              <p className="font-mono text-sm text-emerald-400">{formatMoney(item.price)}</p>
              <p className="text-[10px] uppercase tracking-wide text-amber-400/80">
                {t(reasonKey[item.reason] ?? "market.reasonTrending")}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </GlowCard>
  );
}
