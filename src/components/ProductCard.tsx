import React from "react";
import { Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useI18n } from "../providers/I18nProvider";
import { resolveImageSrc } from "../lib/media";

type Product = {
  id: string;
  name: string;
  description?: string | null;
  emoji?: string | null;
  imageUrl?: string | null;
  currentPrice: number;
  stockQuantity: number;
  isAvailable: boolean;
  category?: { name: string } | null;
};

type ProductCardProps = {
  product: Product;
  currency?: string;
  onAdd?: () => void;
  onClick?: () => void;
  compact?: boolean;
  className?: string;
};

export function ProductCard({
  product,
  currency: currencyProp,
  onAdd,
  onClick,
  compact,
  className,
}: ProductCardProps) {
  const { t, currency: localeCurrency, formatMoney } = useI18n();
  const currency = currencyProp ?? localeCurrency;
  const unavailable = !product.isAvailable || product.stockQuantity <= 0;
  const imageSrc = resolveImageSrc(product.imageUrl);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/80 backdrop-blur-sm transition-all duration-300",
        !unavailable && "hover:border-emerald-500/40 hover:shadow-[0_0_30px_rgba(16,185,129,0.12)]",
        unavailable && "opacity-60",
        className,
      )}
    >
      <button
        type="button"
        onClick={onClick ?? onAdd}
        disabled={unavailable && !onClick}
        className="flex h-full w-full flex-col text-left"
      >
        <div
          className={cn(
            "relative w-full overflow-hidden bg-slate-950",
            compact ? "h-28" : "h-36",
          )}
        >
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 text-5xl">
              {product.emoji || "🍽️"}
            </div>
          )}
          {product.category && (
            <span className="absolute left-2 top-2 rounded-full bg-slate-950/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-400">
              {product.category.name}
            </span>
          )}
          {unavailable && (
            <span className="absolute inset-0 flex items-center justify-center bg-slate-950/70 text-sm font-semibold text-red-400">
              {t("inventory.unavailable")}
            </span>
          )}
        </div>

        <div className={cn("flex flex-1 flex-col p-3", compact && "p-2.5")}>
          <h3 className="line-clamp-1 font-semibold text-white">{product.name}</h3>
          {!compact && product.description && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-400">{product.description}</p>
          )}
          <div className="mt-auto flex items-center justify-between pt-2">
            <span className="text-sm font-bold text-emerald-400">
              {formatMoney(product.currentPrice, currency)}
            </span>
            {!compact && (
              <span className="text-[10px] text-slate-500">
                {t("common.stock")}: {product.stockQuantity}
              </span>
            )}
          </div>
        </div>
      </button>

      {onAdd && !unavailable && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onAdd();
          }}
          className="absolute bottom-3 right-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-emerald-950 shadow-lg transition-transform hover:scale-110 active:scale-95"
        >
          <Plus className="h-5 w-5" />
        </button>
      )}
    </div>
  );
}
