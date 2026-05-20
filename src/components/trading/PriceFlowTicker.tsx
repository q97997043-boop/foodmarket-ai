import React from "react";
import { motion } from "framer-motion";
import { ArrowDownRight, ArrowUpRight, Zap } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";
import type { PriceEntry } from "@/hooks/usePriceTicker";

type PriceFlowTickerProps = {
  changes: PriceEntry[];
  formatMoney: (n: number) => string;
};

export function PriceFlowTicker({ changes, formatMoney }: PriceFlowTickerProps) {
  const { t } = useI18n();

  const items =
    changes.length > 0
      ? changes
      : [
          {
            productId: 0,
            productName: "—",
            currentPrice: 0,
            previousPrice: 0,
            changePercent: 0,
            direction: "unchanged" as const,
            trigger: "algorithm",
            lastUpdated: "",
          },
        ];

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-cyan-500/20 bg-gradient-to-r from-slate-950 via-cyan-950/20 to-slate-950 py-2">
      <motion.div
        className="pointer-events-none absolute left-3 top-1/2 z-10 flex -translate-y-1/2 items-center gap-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2 py-0.5"
        animate={{
          boxShadow: [
            "0 0 6px rgba(34,211,238,0.2)",
            "0 0 16px rgba(34,211,238,0.45)",
            "0 0 6px rgba(34,211,238,0.2)",
          ],
        }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        <Zap className="h-3.5 w-3.5 text-cyan-400" />
        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-300">
          {t("charts.priceFlow")}
        </span>
      </motion.div>

      <motion.div
        className="flex gap-10 whitespace-nowrap pl-36 font-mono text-xs"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((entry, i) => (
          <motion.span
            key={`${entry.productId}-${entry.lastUpdated}-${i}`}
            className="inline-flex items-center gap-2"
            initial={i < items.length ? { opacity: 0, scale: 0.9 } : false}
            animate={{ opacity: 1, scale: 1 }}
          >
            <span className="text-lg">{entry.emoji || "🍽️"}</span>
            <span className="font-semibold text-white">{entry.productName}</span>
            <span className="text-slate-400">{formatMoney(entry.previousPrice)}</span>
            <span className="text-slate-600">→</span>
            <span
              className={
                entry.direction === "up"
                  ? "text-emerald-400"
                  : entry.direction === "down"
                    ? "text-rose-400"
                    : "text-slate-400"
              }
            >
              {formatMoney(entry.currentPrice)}
            </span>
            <span
              className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-bold ${
                entry.direction === "up"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : entry.direction === "down"
                    ? "bg-rose-500/15 text-rose-400"
                    : "bg-slate-800 text-slate-500"
              }`}
            >
              {entry.direction === "up" ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : entry.direction === "down" ? (
                <ArrowDownRight className="h-3 w-3" />
              ) : null}
              {entry.changePercent > 0 ? "+" : ""}
              {entry.changePercent.toFixed(1)}%
            </span>
            <span className="text-[10px] uppercase text-slate-600">{entry.trigger}</span>
          </motion.span>
        ))}
      </motion.div>
    </div>
  );
}
