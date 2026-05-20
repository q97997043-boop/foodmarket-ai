import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { GlowCard } from "./GlowCard";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

export type HeatmapItem = {
  productId: string;
  name: string;
  emoji: string | null;
  heat: number;
  currentPrice: number;
  changePercent: number;
  isHot: boolean;
};

type HeatmapGridProps = {
  items: HeatmapItem[];
  formatMoney: (n: number) => string;
  onSelect?: (id: string) => void;
  selectedId?: string | null;
  /** productId → heat from live demand websocket */
  liveHeat?: Map<string, number>;
  /** productIds with surging demand (pulse animation) */
  surgeIds?: Set<string>;
};

function heatClass(heat: number) {
  if (heat >= 70) return "heat-cell-high";
  if (heat >= 40) return "heat-cell-mid";
  return "heat-cell-low";
}

export function HeatmapGrid({
  items,
  formatMoney,
  onSelect,
  selectedId,
  liveHeat,
  surgeIds,
}: HeatmapGridProps) {
  const { t } = useI18n();

  const sorted = useMemo(
    () => [...items].sort((a, b) => (liveHeat?.get(b.productId) ?? b.heat) - (liveHeat?.get(a.productId) ?? a.heat)),
    [items, liveHeat],
  );

  return (
    <GlowCard delay={0.1} className="h-full">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-cyan-400">
          {t("market.heatmap")}
        </h3>
        <motion.span
          className="font-mono text-[10px] text-emerald-400/80"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {t("charts.heatmapLive")}
        </motion.span>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
        {sorted.map((item, i) => {
          const heat = liveHeat?.get(item.productId) ?? item.heat;
          const surging = surgeIds?.has(item.productId);

          return (
            <motion.button
              key={item.productId}
              type="button"
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{
                opacity: 1,
                scale: surging ? [1, 1.06, 1] : 1,
                boxShadow: surging
                  ? [
                      "0 0 0 rgba(244,63,94,0)",
                      "0 0 20px rgba(244,63,94,0.35)",
                      "0 0 0 rgba(244,63,94,0)",
                    ]
                  : "none",
              }}
              transition={{
                delay: i * 0.03,
                scale: surging ? { repeat: Infinity, duration: 1.2 } : undefined,
                boxShadow: surging ? { repeat: Infinity, duration: 1.2 } : undefined,
                layout: { type: "spring", stiffness: 300, damping: 28 },
              }}
              onClick={() => onSelect?.(item.productId)}
              className={cn(
                "rounded-xl border p-2.5 text-left transition-colors",
                heatClass(heat),
                selectedId === item.productId && "ring-2 ring-emerald-400",
                item.isHot && "animate-neon-pulse",
              )}
            >
              <div className="flex items-center justify-between gap-1">
                <span className="truncate text-xs font-semibold text-white">
                  {item.emoji} {item.name}
                </span>
                <motion.span
                  key={Math.round(heat)}
                  className="font-mono text-[10px] text-emerald-400"
                  initial={{ scale: 1.3, color: "#6ee7b7" }}
                  animate={{ scale: 1, color: "#34d399" }}
                >
                  {Math.round(heat)}%
                </motion.span>
              </div>
              <p className="mt-1 font-mono text-sm font-bold text-white">
                {formatMoney(item.currentPrice)}
              </p>
              <p
                className={cn(
                  "font-mono text-[10px]",
                  item.changePercent >= 0 ? "text-emerald-400" : "text-rose-400",
                )}
              >
                {item.changePercent >= 0 ? "+" : ""}
                {item.changePercent.toFixed(1)}%
              </p>
            </motion.button>
          );
        })}
      </div>
    </GlowCard>
  );
}
