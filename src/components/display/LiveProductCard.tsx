import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Zap, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { resolveImageSrc } from "@/lib/media";
import { PriceFlash } from "@/components/PriceFlash";
import { MiniSparkline } from "@/components/trading/MiniSparkline";
import { useI18n } from "@/providers/I18nProvider";
import type { LiveProduct } from "@/hooks/useLiveProducts";

type LiveProductCardProps = {
  product: LiveProduct;
  size?: "md" | "lg" | "xl";
  accent?: string;
  index?: number;
  onClick?: () => void;
  selected?: boolean;
  sparklineValues?: number[];
};

const sizeMap = {
  md: { pad: "p-3", img: "h-24", title: "text-sm", price: "text-lg" },
  lg: { pad: "p-4", img: "h-32", title: "text-base", price: "text-2xl" },
  xl: {
    pad: "p-5",
    img: "h-40 md:h-48",
    title: "text-lg md:text-xl",
    price: "text-3xl md:text-4xl",
  },
};

export function LiveProductCard({
  product,
  size = "lg",
  accent = "#00ff88",
  index = 0,
  onClick,
  selected,
  sparklineValues,
}: LiveProductCardProps) {
  const { t } = useI18n();
  const s = sizeMap[size];
  const imageSrc = resolveImageSrc(product.imageUrl);

  const signalLabel =
    product.aiSignal === "bullish"
      ? t("display.signalBull")
      : product.aiSignal === "bearish"
        ? t("display.signalBear")
        : t("display.signalNeutral");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.04, type: "spring", stiffness: 260, damping: 24 }}
      onClick={onClick}
      className={cn(
        "cyber-glow-card group relative flex min-w-0 max-w-full flex-col overflow-hidden rounded-2xl",
        onClick && "cursor-pointer",
        selected && "cyber-glow-active ring-2 ring-emerald-400/60",
        product.isHot && "animate-neon-pulse",
      )}
      style={{ "--accent": accent } as React.CSSProperties}
    >
      <motion.div
        className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full opacity-20 blur-2xl"
        style={{ background: accent }}
        animate={{ scale: [1, 1.2, 1], opacity: [0.15, 0.25, 0.15] }}
        transition={{ repeat: Infinity, duration: 4 }}
      />

      <div className={cn("relative overflow-hidden bg-slate-950", s.img)}>
        {imageSrc ? (
          <motion.img
            src={imageSrc}
            alt={product.name}
            className="h-full w-full object-cover"
            whileHover={{ scale: 1.05 }}
            transition={{ duration: 0.4 }}
          />
        ) : (
          <motion.div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-5xl md:text-6xl">
            {product.emoji || "🍽️"}
          </motion.div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
        <div className="absolute left-2 top-2 flex flex-wrap gap-1">
          {product.isHot && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-rose-500/50 bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-300">
              <Flame className="h-3 w-3" />
              {t("market.hot")}
            </span>
          )}
          {product.isTrending && (
            <span className="inline-flex items-center gap-0.5 rounded-full border border-cyan-500/50 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cyan-300">
              <TrendingUp className="h-3 w-3" />
              {t("display.trending")}
            </span>
          )}
        </div>
        <div className="absolute bottom-2 right-2 rounded-lg border border-slate-700/80 bg-slate-950/90 px-2 py-1 font-mono text-[10px] text-emerald-400">
          {t("display.popularity")} {product.popularity}%
        </div>
      </div>

      <div className={cn("flex min-w-0 flex-1 flex-col", s.pad)}>
        {product.category && (
          <span className="mb-1 font-mono text-[10px] uppercase tracking-widest text-slate-500">
            {product.category}
          </span>
        )}
        <h3 className={cn("line-clamp-1 font-bold text-white", s.title)}>{product.name}</h3>
        <div className="mt-2 flex items-end justify-between gap-2">
          <PriceFlash
            price={product.currentPrice}
            direction={product.direction}
            isFlashing={product.isFlashing}
            changePercent={product.changePercent}
            className={s.price}
            showChange
          />
        </div>
        <div className="mt-3 min-w-0">
          <MiniSparkline
            values={sparklineValues ?? []}
            direction={product.direction}
            accent={accent}
            isFlashing={product.isFlashing}
            height={32}
          />
        </div>
        <motion.div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-800/80 pt-3 text-[10px] md:text-xs">
          <motion.div
            className="flex items-center gap-1 rounded-lg bg-fuchsia-500/10 px-2 py-1.5 text-fuchsia-300"
            animate={{ opacity: [0.85, 1, 0.85] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
          >
            <Zap className="h-3 w-3 shrink-0" />
            <span className="truncate font-mono">{signalLabel}</span>
          </motion.div>
          <motion.div className="flex items-center gap-1 rounded-lg bg-cyan-500/10 px-2 py-1.5 font-mono text-cyan-300">
            <ShoppingBag className="h-3 w-3 shrink-0" />
            <span>
              {product.liveOrders} {t("display.ordersLive")}
            </span>
          </motion.div>
        </motion.div>
      </div>
    </motion.article>
  );
}
