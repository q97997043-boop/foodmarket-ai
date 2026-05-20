import React, { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type MiniSparklineProps = {
  values: number[];
  direction?: "up" | "down" | "unchanged";
  accent?: string;
  isFlashing?: boolean;
  className?: string;
  height?: number;
};

export function MiniSparkline({
  values,
  direction = "unchanged",
  accent = "#10b981",
  isFlashing = false,
  className,
  height = 36,
}: MiniSparklineProps) {
  const gradId = useId().replace(/:/g, "");
  const width = 100;

  const { path, areaPath, color, glow } = useMemo(() => {
    if (values.length < 2) {
      return { path: "", areaPath: "", color: "#64748b", glow: "transparent" };
    }

    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || max * 0.02 || 1;
    const padY = 3;

    const pts = values.map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      const y =
        height - padY - ((v - min) / range) * (height - padY * 2);
      return { x, y };
    });

    const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
    const area =
      line +
      ` L${width},${height} L0,${height} Z`;

    const first = values[0];
    const last = values[values.length - 1];
    const dir =
      direction !== "unchanged"
        ? direction
        : last > first
          ? "up"
          : last < first
            ? "down"
            : "unchanged";

    const c =
      dir === "up" ? "#10b981" : dir === "down" ? "#f43f5e" : accent;
    const g =
      dir === "up"
        ? "rgba(16,185,129,0.55)"
        : dir === "down"
          ? "rgba(244,63,94,0.55)"
          : "rgba(34,211,238,0.35)";

    return { path: line, areaPath: area, color: c, glow: g };
  }, [values, direction, accent, height]);

  if (values.length < 2) {
    return (
      <div
        className={cn(
          "flex h-9 w-full items-center justify-center rounded-lg border border-slate-800/80 bg-slate-950/60",
          className,
        )}
        style={{ height }}
      >
        <span className="font-mono text-[9px] text-slate-600">···</span>
      </div>
    );
  }

  return (
    <motion.div
      className={cn(
        "relative w-full overflow-hidden rounded-lg border border-slate-800/60 bg-slate-950/80",
        isFlashing && "ring-1 ring-emerald-400/40",
        className,
      )}
      style={{ height }}
      animate={
        isFlashing
          ? {
              boxShadow: [
                `0 0 8px ${glow}`,
                `0 0 18px ${glow}`,
                `0 0 8px ${glow}`,
              ],
            }
          : undefined
      }
      transition={{ duration: 0.8 }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id={`sp-${gradId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.35} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
          <filter id={`glow-${gradId}`}>
            <feGaussianBlur stdDeviation="1.2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path d={areaPath} fill={`url(#sp-${gradId})`} />
        <motion.path
          d={path}
          fill="none"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${gradId})`}
          initial={{ pathLength: 0, opacity: 0.5 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
        <circle
          cx={width}
          cy={
            values.length >= 2
              ? height -
                3 -
                ((values[values.length - 1] - Math.min(...values)) /
                  (Math.max(...values) - Math.min(...values) || 1)) *
                  (height - 6)
              : height / 2
          }
          r={2.5}
          fill={color}
          className="animate-pulse"
        />
      </svg>
    </motion.div>
  );
}
