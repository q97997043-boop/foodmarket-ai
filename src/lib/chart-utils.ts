export type PricePoint = { t: string; price: number };

export type Candle = {
  time: string;
  ts: number;
  open: number;
  high: number;
  low: number;
  close: number;
  bullish: boolean;
  volatility: number;
};

export type ChartRow = Candle & {
  aiPrice?: number;
  isForecast?: boolean;
  bandTop?: number;
  bandBottom?: number;
  lineColor: string;
};

const BUCKET_MS = 5 * 60 * 1000;

export function pointsToCandles(points: PricePoint[]): Candle[] {
  if (points.length === 0) return [];

  const sorted = [...points].sort(
    (a, b) => new Date(a.t).getTime() - new Date(b.t).getTime(),
  );

  if (sorted.length <= 3) {
    return sorted.map((p, i) => {
      const open = sorted[i - 1]?.price ?? p.price;
      const close = p.price;
      const wick = Math.max(Math.abs(close - open) * 0.15, close * 0.002);
      return toCandle(p.t, open, close, wick);
    });
  }

  const buckets = new Map<number, PricePoint[]>();
  for (const p of sorted) {
    const ts = new Date(p.t).getTime();
    const key = Math.floor(ts / BUCKET_MS) * BUCKET_MS;
    const arr = buckets.get(key) ?? [];
    arr.push(p);
    buckets.set(key, arr);
  }

  const candles: Candle[] = [];
  for (const [ts, bucket] of [...buckets.entries()].sort((a, b) => a[0] - b[0])) {
    const prices = bucket.map((b) => b.price);
    const open = prices[0];
    const close = prices[prices.length - 1];
    const high = Math.max(...prices);
    const low = Math.min(...prices);
    candles.push({
      time: new Date(ts).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ts,
      open,
      high,
      low,
      close,
      bullish: close >= open,
      volatility: ((high - low) / Math.max(close, 1)) * 100,
    });
  }

  return candles;
}

function toCandle(t: string, open: number, close: number, wick: number): Candle {
  const high = Math.max(open, close) + wick;
  const low = Math.min(open, close) - wick;
  return {
    time: new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    ts: new Date(t).getTime(),
    open,
    high,
    low,
    close,
    bullish: close >= open,
    volatility: ((high - low) / Math.max(close, 1)) * 100,
  };
}

export function calcMarketVolatility(candles: Candle[]): number {
  if (candles.length < 2) return 0;
  const vols = candles.map((c) => c.volatility);
  return vols.reduce((a, b) => a + b, 0) / vols.length;
}

export function appendLiveTick(
  points: PricePoint[],
  tick: { t: string; price: number },
  maxPoints = 120,
): PricePoint[] {
  const last = points[points.length - 1];
  if (last && last.price === tick.price && last.t === tick.t) return points;
  return [...points, tick].slice(-maxPoints);
}

export function buildChartRows(
  candles: Candle[],
  options?: {
    predictedChangePct?: number;
    accentUp?: string;
    accentDown?: string;
    forecastSteps?: number;
  },
): ChartRow[] {
  const up = options?.accentUp ?? "#10b981";
  const down = options?.accentDown ?? "#f43f5e";
  const avgVol =
    candles.length > 0
      ? candles.reduce((s, c) => s + c.volatility, 0) / candles.length
      : 1;

  const rows: ChartRow[] = candles.map((c) => ({
    ...c,
    lineColor: c.bullish ? up : down,
    bandTop: c.close * (1 + (c.volatility / 100) * 0.5),
    bandBottom: c.close * (1 - (c.volatility / 100) * 0.5),
  }));

  if (candles.length === 0 || options?.predictedChangePct === undefined) {
    return rows;
  }

  const last = candles[candles.length - 1];
  const target = last.close * (1 + options.predictedChangePct / 100);
  const steps = options.forecastSteps ?? 4;

  for (let i = 1; i <= steps; i++) {
    const frac = i / steps;
    const aiPrice = last.close + (target - last.close) * frac;
    const ts = last.ts + i * BUCKET_MS;
    rows.push({
      time: `+${i * 5}m`,
      ts,
      open: aiPrice,
      high: aiPrice * 1.003,
      low: aiPrice * 0.997,
      close: aiPrice,
      bullish: aiPrice >= last.close,
      volatility: avgVol,
      aiPrice,
      isForecast: true,
      lineColor: "#e879f9",
      bandTop: aiPrice * 1.01,
      bandBottom: aiPrice * 0.99,
    });
  }

  return rows;
}

export function yDomain(rows: ChartRow[]): [number, number] {
  if (rows.length === 0) return [0, 100];
  const lows = rows.map((r) => r.low);
  const highs = rows.map((r) => r.high);
  const min = Math.min(...lows);
  const max = Math.max(...highs);
  const pad = (max - min) * 0.08 || max * 0.05;
  return [Math.max(0, min - pad), max + pad];
}
