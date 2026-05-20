/**
 * src/components/realtime/FlashAlertBanner.tsx
 *
 * Stacked alert banners that appear in the top-right of the TV Dashboard.
 * Each alert slides in, stays for 8 seconds, then fades out automatically.
 * The user can also dismiss an alert by clicking the × button.
 */

import { cn } from "@/lib/utils";
import type { LiveAlert } from "@/hooks/useRealtimeMarket";

interface FlashAlertBannerProps {
  alerts: LiveAlert[];
  onDismiss: (id: string) => void;
  className?: string;
}

const SEVERITY_STYLES: Record<string, string> = {
  info:     "border-sky-500/50 bg-sky-950/80 text-sky-200",
  warning:  "border-amber-500/50 bg-amber-950/80 text-amber-200",
  critical: "border-red-500/60 bg-red-950/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.3)]",
};

const TYPE_ICONS: Record<string, string> = {
  price_surge: "🚀",
  price_drop:  "📉",
  high_demand: "🔥",
  low_demand:  "❄️",
  order_spike: "⚡",
  system:      "⚙️",
};

export function FlashAlertBanner({ alerts, onDismiss, className }: FlashAlertBannerProps) {
  const visible = alerts.filter((a) => a.visible);

  if (visible.length === 0) return null;

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex flex-col gap-2 w-80",
        className,
      )}
      aria-live="polite"
      aria-label="Live market alerts"
    >
      {visible.map((alert) => (
        <div
          key={alert.id}
          className={cn(
            "relative rounded-lg border px-4 py-3 backdrop-blur-sm",
            "animate-slide-in-right",
            SEVERITY_STYLES[alert.severity] ?? SEVERITY_STYLES.info,
          )}
          role="alert"
        >
          <button
            type="button"
            onClick={() => onDismiss(alert.id)}
            className="absolute right-2 top-2 rounded p-0.5 opacity-60 hover:opacity-100 transition-opacity"
            aria-label="Dismiss alert"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
              <path d="M9.5 2.5L6 6l3.5 3.5-1 1L5 7 1.5 10.5l-1-1L4 6 .5 2.5l1-1L5 5 8.5 1.5z" />
            </svg>
          </button>

          <div className="flex items-start gap-2 pr-4">
            <span className="text-lg leading-none shrink-0 mt-0.5" aria-hidden>
              {TYPE_ICONS[alert.type] ?? "📢"}
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-wide opacity-80">
                {alert.title}
              </p>
              <p className="text-sm font-medium mt-0.5 leading-snug">
                {alert.message}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
