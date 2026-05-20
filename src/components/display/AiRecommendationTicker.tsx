import React from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";

type RecItem = {
  productId: string;
  name: string;
  emoji: string | null;
  price: number;
  reason: string;
};

type AiRecommendationTickerProps = {
  items: RecItem[];
  formatMoney: (n: number) => string;
};

function reasonKey(reason: string): string {
  if (reason === "low_stock_surge") return "market.reasonLowStock";
  if (reason === "trending_up") return "market.reasonTrending";
  return "market.reasonValue";
}

export function AiRecommendationTicker({
  items,
  formatMoney,
}: AiRecommendationTickerProps) {
  const { t } = useI18n();
  const pool =
    items.length > 0
      ? items
      : [{ productId: "0", name: "—", emoji: "🤖", price: 0, reason: "value_pick" }];
  const doubled = [...pool, ...pool];

  return (
    <div className="relative overflow-hidden border-y border-fuchsia-500/25 bg-gradient-to-r from-fuchsia-950/40 via-slate-950/80 to-cyan-950/40 py-2.5">
      <motion.div
        className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full border border-fuchsia-500/40 bg-fuchsia-500/15 px-2 py-0.5"
        animate={{ boxShadow: ["0 0 8px rgba(232,121,249,0.2)", "0 0 20px rgba(232,121,249,0.45)", "0 0 8px rgba(232,121,249,0.2)"] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Sparkles className="h-3.5 w-3.5 text-fuchsia-400" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-fuchsia-300">
          {t("display.aiTicker")}
        </span>
      </motion.div>

      <motion.div
        className="flex gap-16 whitespace-nowrap pl-36 font-mono text-sm"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((item, i) => (
          <span
            key={`${item.productId}-${i}`}
            className="inline-flex items-center gap-2 text-slate-200"
          >
            <span className="text-lg">{item.emoji || "🍽️"}</span>
            <span className="font-bold text-white">{item.name}</span>
            <span className="text-emerald-400">{formatMoney(item.price)}</span>
            <span className="text-fuchsia-400/80">· {t(reasonKey(item.reason))}</span>
          </span>
        ))}
      </motion.div>
    </div>
  );
}
