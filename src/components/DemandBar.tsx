/**
 * src/components/realtime/DemandBar.tsx
 *
 * Animated heat score bar with colour gradient based on intensity.
 * Transitions smoothly when DEMAND_CHANGED events update the heatScore.
 *
 * Colour scale:
 *   0–20   → cold blue  (crashing)
 *   20–40  → cool teal  (falling)
 *   40–60  → neutral    (stable)
 *   60–80  → amber      (rising)
 *   80–100 → hot red    (surging)
 */

import { cn } from "@/lib/utils";

interface DemandBarProps {
  heatScore: number;       // 0–100
  trend: string;
  showLabel?: boolean;
  className?: string;
  height?: "sm" | "md" | "lg";
}

function getBarColour(score: number): string {
  if (score >= 80) return "from-orange-500 to-red-500";
  if (score >= 60) return "from-yellow-400 to-orange-500";
  if (score >= 40) return "from-emerald-400 to-teal-500";
  if (score >= 20) return "from-sky-400 to-teal-400";
  return "from-blue-500 to-sky-500";
}

function getTrendLabel(trend: string): { text: string; icon: string } {
  const map: Record<string, { text: string; icon: string }> = {
    surging:  { text: "Surging",  icon: "🔥" },
    rising:   { text: "Rising",   icon: "↑"  },
    stable:   { text: "Stable",   icon: "→"  },
    falling:  { text: "Falling",  icon: "↓"  },
    crashing: { text: "Crashing", icon: "❄️" },
  };
  return map[trend] ?? { text: trend, icon: "" };
}

const heightMap = { sm: "h-1.5", md: "h-2.5", lg: "h-4" };

export function DemandBar({
  heatScore,
  trend,
  showLabel = true,
  className,
  height = "md",
}: DemandBarProps) {
  const clamped = Math.max(0, Math.min(100, heatScore));
  const colour  = getBarColour(clamped);
  const label   = getTrendLabel(trend);

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {showLabel && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{label.icon} {label.text}</span>
          <span className="font-mono font-medium">{Math.round(clamped)}°</span>
        </div>
      )}
      <div
        className={cn("relative w-full rounded-full bg-muted/40 overflow-hidden", heightMap[height])}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn(
            "absolute inset-y-0 left-0 rounded-full bg-gradient-to-r",
            colour,
            // Pulse animation for surging state
            trend === "surging" && "animate-pulse",
          )}
          style={{
            width: `${clamped}%`,
            transition: "width 600ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        />
      </div>
    </div>
  );
}
