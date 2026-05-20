/**
 * src/components/realtime/ConnectionStatus.tsx
 *
 * Minimal connection indicator shown in the TV Dashboard and Admin header.
 * Displays a coloured dot + latency reading.
 */

import { cn } from "@/lib/utils";
import { useRealtimeContext } from "@/providers/RealtimeProvider";
import { useI18n } from "@/providers/I18nProvider";

interface ConnectionStatusProps {
  className?: string;
  showLatency?: boolean;
}

export function ConnectionStatus({ className, showLatency = true }: ConnectionStatusProps) {
  const { t } = useI18n();
  const { isConnected, isConnecting, latencyMs, reconnectAttempt } =
    useRealtimeContext();

  if (isConnecting && reconnectAttempt > 0) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-amber-400", className)}>
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
        </span>
        {t("connection.reconnecting", { attempt: reconnectAttempt })}
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className={cn("flex items-center gap-1.5 text-xs text-red-400", className)}>
        <span className="inline-flex h-2 w-2 rounded-full bg-red-400" />
        {t("connection.disconnected")}
      </div>
    );
  }

  const latencyColour =
    latencyMs === null ? "text-muted-foreground"
    : latencyMs < 80  ? "text-emerald-400"
    : latencyMs < 250 ? "text-yellow-400"
    : "text-red-400";

  return (
    <div className={cn("flex items-center gap-1.5 text-xs", latencyColour, className)}>
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-40" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
      </span>
      <span>{t("connection.live")}</span>
      {showLatency && latencyMs !== null && (
        <span className="opacity-70 font-mono">{latencyMs}ms</span>
      )}
    </div>
  );
}
