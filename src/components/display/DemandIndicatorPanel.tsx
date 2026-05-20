import React from "react";
import { motion } from "framer-motion";
import { Activity } from "lucide-react";
import { GlowCard } from "@/components/trading/GlowCard";
import { useI18n } from "@/providers/I18nProvider";
import type { LiveProduct } from "@/hooks/useLiveProducts";
import { cn } from "@/lib/utils";

type DemandIndicatorPanelProps = {
  products: LiveProduct[];
};

export function DemandIndicatorPanel({ products }: DemandIndicatorPanelProps) {
  const { t } = useI18n();
  const sorted = [...products].sort((a, b) => b.heat - a.heat).slice(0, 8);
  const maxHeat = Math.max(...sorted.map((p) => p.heat), 1);

  return (
    <GlowCard delay={0.12}>
      <motion.div className="mb-3 flex items-center gap-2">
        <Activity className="h-5 w-5 text-cyan-400" />
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-cyan-400">
          {t("display.demandIndicator")}
        </h3>
      </motion.div>
      <div className="space-y-2">
        {sorted.map((p, i) => (
          <motion.div
            key={p.productId}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <motion.div className="mb-1 flex justify-between text-xs">
              <span className="truncate text-slate-300">
                {p.emoji} {p.name}
              </span>
              <span className="font-mono text-emerald-400">{Math.round(p.heat)}%</span>
            </motion.div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-800">
              <motion.div
                className={cn(
                  "h-full rounded-full",
                  p.heat >= 70
                    ? "bg-gradient-to-r from-rose-500 to-orange-400"
                    : p.heat >= 40
                      ? "bg-gradient-to-r from-amber-500 to-yellow-400"
                      : "bg-gradient-to-r from-cyan-600 to-emerald-400",
                )}
                initial={{ width: 0 }}
                animate={{ width: `${(p.heat / maxHeat) * 100}%` }}
                transition={{ duration: 0.8, delay: i * 0.05 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </GlowCard>
  );
}
