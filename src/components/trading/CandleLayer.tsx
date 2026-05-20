import type { ChartRow } from "@/lib/chart-utils";

type CandleLayerProps = {
  xAxisMap?: Record<string, { scale: (v: string) => number; bandwidth?: () => number }>;
  yAxisMap?: Record<string, { scale: (v: number) => number }>;
  offset?: { left?: number; top?: number };
  data?: ChartRow[];
};

export function CandleLayer({
  xAxisMap,
  yAxisMap,
  offset,
  data = [],
}: CandleLayerProps) {
  const xAxis = xAxisMap ? Object.values(xAxisMap)[0] : null;
  const yAxis = yAxisMap ? Object.values(yAxisMap)[0] : null;
  if (!xAxis?.scale || !yAxis?.scale || data.length === 0) return null;

  const xScale = xAxis.scale;
  const yScale = yAxis.scale;
  const bandwidth =
    typeof xAxis.bandwidth === "function" ? xAxis.bandwidth() : 12;
  const left = offset?.left ?? 0;

  return (
    <g className="candle-layer">
      {data.map((d, i) => {
        const x = xScale(d.time) + left + bandwidth / 2;
        const bodyW = Math.max(5, bandwidth * 0.7);
        const color = d.isForecast
          ? "#e879f9"
          : d.bullish
            ? "#10b981"
            : "#f43f5e";
        const glow = d.isForecast
          ? "rgba(232,121,249,0.5)"
          : d.bullish
            ? "rgba(16,185,129,0.45)"
            : "rgba(244,63,94,0.45)";

        const openY = yScale(d.open);
        const closeY = yScale(d.close);
        const highY = yScale(d.high);
        const lowY = yScale(d.low);
        const top = Math.min(openY, closeY);
        const bottom = Math.max(openY, closeY);
        const bodyH = Math.max(bottom - top, 2);

        return (
          <g key={`${d.ts}-${i}`} filter={`drop-shadow(0 0 3px ${glow})`}>
            <line
              x1={x}
              x2={x}
              y1={highY}
              y2={lowY}
              stroke={color}
              strokeWidth={1.5}
              opacity={d.isForecast ? 0.5 : 1}
            />
            <rect
              x={x - bodyW / 2}
              y={top}
              width={bodyW}
              height={bodyH}
              fill={color}
              fillOpacity={d.isForecast ? 0.3 : 0.85}
              stroke={color}
              rx={1}
            />
          </g>
        );
      })}
    </g>
  );
}
