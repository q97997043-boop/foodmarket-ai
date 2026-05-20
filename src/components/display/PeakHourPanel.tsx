import React from "react";
import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { GlowCard } from "@/components/trading/GlowCard";
import { useI18n } from "@/providers/I18nProvider";

type PeakHourPanelProps = {
  hour: number;
  label: "now" | "forecast";
  intensity: number;
};

export function PeakHourPanel({ hour, label, intensity }: PeakHourPanelProps) {
  const { t } = useI18n();
  const displayHour = `${hour.toString().padStart(2, "0")}:00`;

  return (
    <GlowCard delay={0.14}>
      <div className="mb-3 flex items-center gap-2">
        <Clock className="h-5 w-5 text-violet-400" />
        <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-violet-400">
          {t("display.peakHour")}
        </h3>
      </div>
      <div className="text-center">
        <motion.p
          className="font-mono text-4xl font-bold text-white md:text-5xl"
          animate={{ textShadow: ["0 0 20px rgba(167,139,250,0.3)", "0 0 40px rgba(167,139,250,0.6)", "0 0 20px rgba(167,139,250,0.3)"] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          {displayHour}
        </motion.p>
        <p className="mt-2 text-sm text-slate-400">
          {label === "now" ? t("display.peakNow") : t("display.peakForecast")}
        </p>
        <motion.div className="mx-auto mt-4 h-3 max-w-xs overflow-hidden rounded-full bg-slate-800">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-500"
            initial={{ width: 0 }}
            animate={{ width: `${intensity}%` }}
            transition={{ duration: 1.2 }}
          />
        </motion.div>
        <p className="mt-2 font-mono text-xs text-violet-300">
          {t("display.demandLoad")} {intensity}%
        </p>
      </div>
    </GlowCard>
  );
}
