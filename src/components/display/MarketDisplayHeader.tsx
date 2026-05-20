import React from "react";
import { Link } from "react-router-dom";
import { Maximize2, Tv, LineChart } from "lucide-react";
import { motion } from "framer-motion";
import { BrandLogo } from "@/components/BrandLogo";
import { ConnectionStatus } from "@/components/ConnectionStatus";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type MarketDisplayHeaderProps = {
  restaurantName?: string;
  logoUrl?: string | null;
  bannerUrl?: string | null;
  themeColor?: string;
  titleKey?: string;
  subtitleKey?: string;
  mode?: "market" | "tv" | "display";
  showNav?: boolean;
  /** Leave room for fixed back button */
  backOffset?: boolean;
  className?: string;
};

export function MarketDisplayHeader({
  restaurantName,
  logoUrl,
  bannerUrl,
  themeColor = "#00ff88",
  titleKey = "market.title",
  subtitleKey,
  mode = "market",
  showNav = true,
  backOffset = true,
  className,
}: MarketDisplayHeaderProps) {
  const { t } = useI18n();

  return (
    <header
      className={cn(
        "cyber-panel relative flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 px-4 py-3 md:px-6 md:py-4",
        backOffset && "pl-14 sm:pl-16 md:pl-[4.5rem]",
        className,
      )}
    >
      {bannerUrl && mode === "tv" && (
        <img
          src={bannerUrl}
          alt=""
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-10"
        />
      )}
      <div className="relative z-10 flex items-center gap-3 md:gap-4">
        <BrandLogo
          logoUrl={logoUrl}
          name={restaurantName}
          size={mode === "tv" ? "xl" : "lg"}
          accent={themeColor}
          animate
        />
        <div>
          <motion.h1
            className={cn(
              "cyber-text-glow font-mono font-bold text-white",
              mode === "tv" ? "text-2xl md:text-4xl" : "text-lg md:text-2xl",
            )}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {restaurantName ?? t("common.appName")}
          </motion.h1>
          <p
            className="font-mono text-xs md:text-sm"
            style={{ color: `${themeColor}cc` }}
          >
            {subtitleKey ? t(subtitleKey) : t(titleKey)}
          </p>
        </div>
      </div>

      <div className="relative z-10 flex flex-wrap items-center gap-2">
        <LanguageSwitcher variant="compact" />
        <ConnectionStatus />
        {showNav && mode !== "tv" && (
          <>
            <Link
              to="/tv"
              className="hidden items-center gap-1 rounded-lg border border-cyan-500/30 bg-cyan-500/10 px-3 py-1.5 text-xs font-semibold text-cyan-400 hover:bg-cyan-500/20 sm:flex"
            >
              <Tv className="h-4 w-4" />
              {t("market.tvMode")}
            </Link>
            <Link
              to="/display"
              className="hidden items-center gap-1 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/10 px-3 py-1.5 text-xs font-semibold text-fuchsia-400 sm:flex"
            >
              <Maximize2 className="h-4 w-4" />
              {t("market.customerDisplay")}
            </Link>
            {mode === "display" && (
              <Link
                to="/market"
                className="flex items-center gap-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-400"
              >
                <LineChart className="h-4 w-4" />
                {t("market.title")}
              </Link>
            )}
          </>
        )}
      </div>
    </header>
  );
}
