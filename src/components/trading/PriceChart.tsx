import React from "react";
import { TradingChart } from "./TradingChart";
import type { PriceEntry } from "@/hooks/usePriceTicker";

type Series = {
  productId: string;
  legacyProductId?: number;
  name: string;
  emoji: string | null;
  points: Array<{ t: string; price: number }>;
};

type PriceChartProps = {
  series: Series[];
  accent?: string;
  formatMoney: (n: number) => string;
  legacyProductId?: number | null;
  livePrice?: PriceEntry | null;
  predictedChangePct?: number;
  demandSurging?: boolean;
};

/** Trading-style chart (candles, AI overlay, live WebSocket). Back-compat export. */
export function PriceChart(props: PriceChartProps) {
  return <TradingChart {...props} />;
}
