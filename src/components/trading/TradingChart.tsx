import React, { useId, useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Customized,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, Brain, TrendingDown, TrendingUp } from "lucide-react";
import { GlowCard } from "./GlowCard";
import { CandleLayer } from "./CandleLayer";
import { useLiveChartSeries } from "@/hooks/useLiveChartSeries";
import { useI18n } from "@/providers/I18nProvider";
import { yDomain } from "@/lib/chart-utils";
import type { PriceEntry } from "@/hooks/usePriceTicker";
import { cn } from "@/lib/utils";

type Series = {
  productId: string;
  legacyProductId?: number;
  name: string;
  emoji: string | null;
  points: Array<{ t: string; price: number }>;
};

type TradingChartProps = {
  series: Series[];
  accent?: string;
  formatMoney: (n: number) => string;
  legacyProductId?: number | null;
  livePrice?: PriceEntry | null;
  predictedChangePct?: number;
  demandSurging?: boolean;
};

function ChartTooltip({
  active,
  payload,
  formatMoney,
  priceLabel,
}: {
  active?: boolean;
  payload?: Array<{ payload: Record<string, unknown> }>;
  formatMoney: (n: number) => string;
  priceLabel: string;
}) {
  if (!active || !payload?.[0]) return null;
  const d = payload[0].payload as {
    time: string;
    open: number;
    high: number;
    low: number;
    close: number;
    aiPrice?: number;
    isForecast?: boolean;
    volatility: number;
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-emerald-500/30 bg-slate-950/95 px-3 py-2 font-mono text-xs shadow-[0_0_20px_rgba(0,255,136,0.15)]"
    >
      <p className="text-slate-400">{d.time}</p>
      <p className="text-emerald-400">
        O {formatMoney(d.open)} H {formatMoney(d.high)}
      </p>
      <p className="text-cyan-400">
        L {formatMoney(d.low)} C {formatMoney(d.close)}
      </p>
      {d.isForecast && d.aiPrice != null && (
        <p className="text-fuchsia-400">AI → {formatMoney(d.aiPrice)}</p>
      )}
      <p className="mt-1 text-slate-500">
        σ {d.volatility.toFixed(1)}% · {priceLabel}
      </p>
    </motion.div>
  );
}

export function TradingChart({
  series,
  accent = "#00ff88",
  formatMoney,
  legacyProductId,
  livePrice,
  predictedChangePct,
  demandSurging,
}: TradingChartProps) {
  const { t } = useI18n();
  const gradId = useId().replace(/:/g, "");

  const {
    chartRows,
    volatility,
    lastDirection,
    demandPulse,
    productName,
    productEmoji,
  } = useLiveChartSeries({
    series,
    legacyProductId,
    livePrice,
    predictedChangePct,
    accent,
    demandSurging,
  });

  const enrichedRows = useMemo(
    () =>
      chartRows.map((r) => ({
        ...r,
        histClose: r.isForecast ? undefined : r.close,
      })),
    [chartRows],
  );

  const domain = useMemo(() => yDomain(enrichedRows), [enrichedRows]);
  const hasForecast = enrichedRows.some((r) => r.isForecast);

  return (
    <GlowCard
      className={cn(
        "flex h-full w-full max-w-full min-h-[clamp(16rem,28vh,22rem)] flex-col transition-shadow duration-300",
        demandPulse && "shadow-[0_0_40px_rgba(244,63,94,0.25)]",
        lastDirection === "up" && livePrice && "shadow-[0_0_30px_rgba(16,185,129,0.12)]",
        lastDirection === "down" && livePrice && "shadow-[0_0_30px_rgba(244,63,94,0.12)]",
      )}
    >
      <motion.div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h3 className="font-mono text-sm font-bold uppercase tracking-wider text-emerald-400">
            {t("charts.liveCandles")}
          </h3>
          <motion.span
            className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[10px] text-emerald-400"
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            LIVE
          </motion.span>
        </div>
        {series[0] && (
          <span className="text-lg">
            {productEmoji || series[0].emoji || "📈"}{" "}
            {productName || series[0].name}
          </span>
        )}
      </motion.div>

      <div className="mb-2 flex flex-wrap gap-3 font-mono text-[10px] uppercase tracking-wider">
        <span
          className={cn(
            "flex items-center gap-1 rounded border px-2 py-0.5",
            volatility >= 3
              ? "border-amber-500/40 text-amber-400"
              : "border-slate-700 text-slate-500",
          )}
        >
          <Activity className="h-3 w-3" />
          {t("charts.volatility")} {volatility.toFixed(1)}%
        </span>
        {hasForecast && (
          <span className="flex items-center gap-1 rounded border border-fuchsia-500/40 bg-fuchsia-500/10 px-2 py-0.5 text-fuchsia-400">
            <Brain className="h-3 w-3" />
            {t("charts.aiOverlay")}
          </span>
        )}
        <span
          className={cn(
            "flex items-center gap-1",
            lastDirection === "up"
              ? "text-emerald-400"
              : lastDirection === "down"
                ? "text-rose-400"
                : "text-slate-500",
          )}
        >
          {lastDirection === "up" ? (
            <TrendingUp className="h-3 w-3" />
          ) : lastDirection === "down" ? (
            <TrendingDown className="h-3 w-3" />
          ) : null}
          {t("charts.lastTick")}{" "}
          {livePrice
            ? formatMoney(livePrice.currentPrice)
            : chartRows.length
              ? formatMoney(chartRows[chartRows.length - 1]?.close ?? 0)
              : "—"}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={series[0]?.productId ?? "empty"}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="chart-trading-glow min-h-[clamp(12rem,26vh,20rem)] h-[clamp(12rem,26vh,20rem)] w-full max-w-full flex-1"
        >
          {enrichedRows.length === 0 ? (
            <motion.div className="flex h-full items-center justify-center text-slate-500">
              {t("market.loading")}
            </motion.div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={enrichedRows}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id={`vol-${gradId}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id={`ai-${gradId}`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#e879f9" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="#e879f9" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="2 6"
                  stroke="rgba(148,163,184,0.08)"
                  vertical={false}
                />
                <XAxis
                  dataKey="time"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  axisLine={{ stroke: "rgba(0,255,136,0.15)" }}
                />
                <YAxis
                  domain={domain}
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) =>
                    v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(Math.round(v))
                  }
                  axisLine={{ stroke: "rgba(0,255,136,0.15)" }}
                />
                <Tooltip
                  content={
                    <ChartTooltip
                      formatMoney={formatMoney}
                      priceLabel={t("market.price")}
                    />
                  }
                />
                <Area
                  type="monotone"
                  dataKey="bandTop"
                  stroke="none"
                  fill={`url(#vol-${gradId})`}
                  isAnimationActive
                  animationDuration={600}
                />
                <Area
                  type="monotone"
                  dataKey="bandBottom"
                  stroke="none"
                  fill="#030712"
                  isAnimationActive={false}
                />
                <Customized
                  component={(props: Record<string, unknown>) => (
                    <CandleLayer
                      {...props}
                      data={enrichedRows.filter((r) => !r.isForecast)}
                    />
                  )}
                />
                <Line
                  type="monotone"
                  dataKey="histClose"
                  stroke={accent}
                  strokeWidth={2}
                  dot={false}
                  isAnimationActive
                  animationDuration={500}
                  connectNulls
                />
                <Line
                  type="monotone"
                  dataKey="aiPrice"
                  stroke="#e879f9"
                  strokeWidth={2}
                  strokeDasharray="6 4"
                  dot={{ r: 3, fill: "#e879f9", strokeWidth: 0 }}
                  isAnimationActive
                  animationDuration={600}
                  connectNulls
                />
              </ComposedChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </AnimatePresence>
    </GlowCard>
  );
}

