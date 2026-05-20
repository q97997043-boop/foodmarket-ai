/**
 * src/components/realtime/PriceFlash.tsx
 *
 * Animates a price cell with a green/red flash when a PRICE_UPDATED event
 * arrives.  Uses CSS custom properties and a keyframe animation so the flash
 * works in any theme without JS timers managing colours.
 *
 * Usage:
 *   const { prices, flashingIds } = usePriceTicker({ restaurantId });
 *
 *   <PriceFlash
 *     price={entry.currentPrice}
 *     direction={entry.direction}
 *     isFlashing={flashingIds.has(productId)}
 *     currency="UZS"
 *   />
 */

import { cn } from "@/lib/utils";

interface PriceFlashProps {
  price: number;
  direction: "up" | "down" | "unchanged";
  isFlashing: boolean;
  previousPrice?: number;
  changePercent?: number;
  currency?: string;
  className?: string;
  showChange?: boolean;
}

function formatPrice(value: number, currency = "UZS"): string {
  if (currency === "UZS") {
    return new Intl.NumberFormat("uz-Latn-UZ", {
      style: "decimal",
      maximumFractionDigits: 0,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatChange(pct: number): string {
  if (pct > 0) return `+${pct.toFixed(1)}%`;
  if (pct < 0) return `${pct.toFixed(1)}%`;
  return "0%";
}

export function PriceFlash({
  price,
  direction,
  isFlashing,
  changePercent,
  currency = "UZS",
  className,
  showChange = true,
}: PriceFlashProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 font-mono font-semibold tabular-nums",
        "transition-colors duration-300",
        isFlashing && direction === "up" &&
          "animate-price-flash-up text-emerald-400",
        isFlashing && direction === "down" &&
          "animate-price-flash-down text-red-400",
        !isFlashing && "text-foreground",
        className,
      )}
    >
      {formatPrice(price, currency)}

      {showChange && changePercent !== undefined && changePercent !== 0 && (
        <span
          className={cn(
            "text-xs font-medium",
            direction === "up" ? "text-emerald-400" : "text-red-400",
          )}
        >
          {formatChange(changePercent)}
        </span>
      )}

      {direction !== "unchanged" && (
        <span aria-hidden className="text-xs">
          {direction === "up" ? "▲" : "▼"}
        </span>
      )}
    </span>
  );
}
