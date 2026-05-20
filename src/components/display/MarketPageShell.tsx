import React from "react";
import { cn } from "@/lib/utils";
import { MarketBackButton } from "./MarketBackButton";

type MarketPageShellProps = {
  children: React.ReactNode;
  fullscreen?: boolean;
  className?: string;
  showBack?: boolean;
};

export function MarketPageShell({
  children,
  fullscreen = false,
  className,
  showBack = true,
}: MarketPageShellProps) {
  return (
    <div
      className={cn(
        "market-shell display-4k cyber-grid-bg relative flex w-full max-w-[100vw] flex-col overflow-x-hidden",
        fullscreen
          ? "fixed inset-0 z-50 h-[100dvh] max-h-[100dvh] overflow-hidden"
          : "h-full min-h-0 max-h-full overflow-hidden",
        className,
      )}
    >
      {showBack && <MarketBackButton />}
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
