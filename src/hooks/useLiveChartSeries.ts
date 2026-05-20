import { useEffect, useMemo, useState } from "react";
import {
  appendLiveTick,
  buildChartRows,
  calcMarketVolatility,
  pointsToCandles,
  type ChartRow,
  type PricePoint,
} from "@/lib/chart-utils";
import type { PriceEntry } from "@/hooks/usePriceTicker";

type ApiSeries = {
  productId: string;
  legacyProductId?: number;
  name: string;
  emoji: string | null;
  points: Array<{ t: string; price: number }>;
};

type UseLiveChartSeriesOptions = {
  series: ApiSeries[];
  legacyProductId?: number | null;
  livePrice?: PriceEntry | null;
  predictedChangePct?: number;
  accent?: string;
  demandSurging?: boolean;
};

export function useLiveChartSeries({
  series,
  legacyProductId,
  livePrice,
  predictedChangePct,
  accent = "#00ff88",
  demandSurging = false,
}: UseLiveChartSeriesOptions) {
  const [livePoints, setLivePoints] = useState<PricePoint[]>([]);
  const [tickPulse, setTickPulse] = useState(0);
  const [demandPulse, setDemandPulse] = useState(false);

  const primary = series[0];

  useEffect(() => {
    setLivePoints(primary?.points ?? []);
  }, [primary?.productId, primary?.points]);

  useEffect(() => {
    if (!livePrice || legacyProductId == null) return;
    if (livePrice.productId !== legacyProductId) return;

    setLivePoints((prev) =>
      appendLiveTick(prev, {
        t: livePrice.lastUpdated,
        price: livePrice.currentPrice,
      }),
    );
    setTickPulse((n) => n + 1);
  }, [livePrice, legacyProductId]);

  useEffect(() => {
    if (!demandSurging) return;
    setDemandPulse(true);
    const id = window.setTimeout(() => setDemandPulse(false), 1200);
    return () => window.clearTimeout(id);
  }, [demandSurging]);

  const candles = useMemo(() => pointsToCandles(livePoints), [livePoints]);

  const volatility = useMemo(() => calcMarketVolatility(candles), [candles]);

  const chartRows: ChartRow[] = useMemo(
    () =>
      buildChartRows(candles, {
        predictedChangePct,
        accentUp: accent,
        accentDown: "#f43f5e",
      }),
    [candles, predictedChangePct, accent],
  );

  const lastDirection = livePrice?.direction ?? "unchanged";
  const isFlashing = tickPulse > 0;

  return {
    chartRows,
    candles,
    volatility,
    livePoints,
    lastDirection,
    isFlashing,
    demandPulse,
    productName: primary?.name,
    productEmoji: primary?.emoji,
  };
}
