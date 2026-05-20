/**
 * src/components/realtime/LiveOrderCard.tsx
 *
 * Single order card for the live transaction feed.
 *
 * Slides in from the top with a green flash border when `isNew` is true.
 * After the flash duration the animation class is removed and the card settles.
 */

import { cn } from "@/lib/utils";
import type { LiveOrder } from "@/hooks/useOrderFeed";

interface LiveOrderCardProps {
  order: LiveOrder;
  currency?: string;
  className?: string;
}

const SOURCE_LABELS: Record<string, string> = {
  pos: "POS", dashboard: "Dashboard", mobile: "Mobile", web: "Web",
  yandex: "Yandex", wolt: "Wolt", express24: "Express24", uzum: "Uzum",
};

const STATUS_COLOURS: Record<string, string> = {
  pending:   "text-yellow-400",
  confirmed: "text-sky-400",
  preparing: "text-orange-400",
  ready:     "text-emerald-400",
  served:    "text-emerald-600",
  cancelled: "text-red-500",
};

function formatTotal(total: number, currency = "UZS"): string {
  return new Intl.NumberFormat("uz-Latn-UZ", {
    style: "decimal",
    maximumFractionDigits: 0,
  }).format(total) + (currency === "UZS" ? " сўм" : "");
}

export function LiveOrderCard({ order, currency = "UZS", className }: LiveOrderCardProps) {
  return (
    <article
      className={cn(
        "relative rounded-lg border bg-card/60 px-4 py-3",
        "transition-all duration-300",
        order.isNew && [
          "border-emerald-500/80 shadow-[0_0_16px_2px_rgba(16,185,129,0.25)]",
          "animate-slide-in-top",
        ],
        !order.isNew && "border-border/50",
        className,
      )}
    >
      {order.isNew && (
        <span className="absolute -top-2 right-3 rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider animate-bounce">
          New
        </span>
      )}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-foreground">
            #{order.orderNumber}
          </p>
          {order.tableNumber && (
            <p className="text-xs text-muted-foreground">Table {order.tableNumber}</p>
          )}
          {order.customerName && (
            <p className="text-xs text-muted-foreground truncate max-w-[120px]">
              {order.customerName}
            </p>
          )}
        </div>

        <div className="text-right shrink-0">
          <p className="text-sm font-bold font-mono text-foreground">
            {formatTotal(order.total, currency)}
          </p>
          <p className={cn("text-xs font-medium capitalize", STATUS_COLOURS[order.status] ?? "text-muted-foreground")}>
            {order.status}
          </p>
        </div>
      </div>

      {order.items.length > 0 && (
        <ul className="mt-2 space-y-0.5">
          {order.items.slice(0, 3).map((item, i) => (
            <li key={i} className="flex justify-between text-xs text-muted-foreground">
              <span className="truncate max-w-[140px]">
                {item.quantity}× {item.productName}
              </span>
              <span className="font-mono shrink-0">
                {formatTotal(item.totalPrice, currency)}
              </span>
            </li>
          ))}
          {order.items.length > 3 && (
            <li className="text-xs text-muted-foreground/60">
              +{order.items.length - 3} more
            </li>
          )}
        </ul>
      )}

      <div className="mt-2 flex items-center justify-between">
        <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wide">
          {SOURCE_LABELS[order.source] ?? order.source}
        </span>
        <span className="text-[10px] text-muted-foreground/60">
          {new Date(order.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </article>
  );
}
