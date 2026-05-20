import React from "react";
import { motion } from "framer-motion";
import { Brain, TrendingDown, TrendingUp, Minus } from "lucide-react";
import { GlowCard } from "./GlowCard";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

export type Prediction = {
  productId: string;
  productName: string;
  emoji: string | null;
  currentPrice: number;
  predictedChangePct: number;
  confidence: number;
  signal: string;
};

type AiPredictionCardProps = {
  predictions: Prediction[];
  formatMoney: (n: number) => string;
};

export function AiPredictionCard({ predictions, formatMoney }: AiPredictionCardProps) {
  const { t } = useI18n();

  return (
    <GlowCard delay={0.15}>
      <div className="mb-3 flex items-center gap-2">
        <Brain className="h-5 w-5 text-fuchsia-400" />
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-fuchsia-400">
          {t("market.aiPredictions")}
        </h3>
      </div>
      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
        {predictions.map((p, i) => {
          const Icon =
            p.signal === "bullish"
              ? TrendingUp
              : p.signal === "bearish"
                ? TrendingDown
                : Minus;
          return (
            <motion.div
              key={p.productId}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/60 px-3 py-2"
            >
              <span className="text-lg">{p.emoji || "🍽️"}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">{p.productName}</p>
                <p className="font-mono text-xs text-slate-500">{formatMoney(p.currentPrice)}</p>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "flex items-center justify-end gap-0.5 font-mono text-sm font-bold",
                    p.predictedChangePct >= 0 ? "text-emerald-400" : "text-rose-400",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {p.predictedChangePct > 0 ? "+" : ""}
                  {p.predictedChangePct}%
                </p>
                <p className="text-[10px] text-slate-500">
                  {t("market.confidence")} {p.confidence}%
                </p>
              </div>
            </motion.div>
          );
        })}
        {predictions.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-500">{t("market.noPredictions")}</p>
        )}
      </div>
    </GlowCard>
  );
}
