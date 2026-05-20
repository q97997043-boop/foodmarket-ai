import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { resolveImageSrc } from "@/lib/media";
import { PriceFlash } from "@/components/PriceFlash";
import { useI18n } from "@/providers/I18nProvider";
import type { LiveProduct } from "@/hooks/useLiveProducts";

type PromotionCarouselProps = {
  products: LiveProduct[];
  accent?: string;
  intervalMs?: number;
};

export function PromotionCarousel({
  products,
  accent = "#00ff88",
  intervalMs = 6000,
}: PromotionCarouselProps) {
  const { t } = useI18n();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (products.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % products.length);
    }, intervalMs);
    return () => window.clearInterval(id);
  }, [products.length, intervalMs]);

  const product = products[index];
  if (!product) {
    return (
      <div className="flex h-full min-h-[280px] items-center justify-center rounded-2xl border border-slate-800 bg-slate-950/50 text-slate-500">
        {t("market.loading")}
      </div>
    );
  }

  const imageSrc = resolveImageSrc(product.imageUrl);

  return (
    <div
      className="relative h-full min-h-[280px] overflow-hidden rounded-2xl border border-emerald-500/20 bg-slate-950"
      style={{ boxShadow: `0 0 60px ${accent}22` }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={product.productId}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0 flex flex-col"
        >
          {imageSrc ? (
            <img src={imageSrc} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
          ) : (
            <motion.div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-8xl opacity-80">
              {product.emoji || "🍽️"}
            </motion.div>
          )}
          <div className="relative mt-auto bg-gradient-to-t from-slate-950 via-slate-950/90 to-transparent p-6 md:p-8">
            <p className="font-mono text-xs uppercase tracking-[0.35em] text-cyan-400">
              {t("display.featuredPromo")}
            </p>
            <h2 className="mt-2 text-3xl font-bold text-white md:text-5xl">{product.name}</h2>
            <div className="mt-4">
              <PriceFlash
                price={product.currentPrice}
                direction={product.direction}
                isFlashing={product.isFlashing}
                changePercent={product.changePercent}
                className="text-3xl md:text-4xl"
              />
            </div>
            {(product.isHot || product.isTrending) && (
              <div className="mt-3 flex gap-2">
                {product.isHot && (
                  <span className="rounded-full bg-rose-500/20 px-3 py-1 text-xs font-bold uppercase text-rose-400">
                    {t("market.hot")}
                  </span>
                )}
                {product.isTrending && (
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-bold uppercase text-cyan-400">
                    {t("display.trending")}
                  </span>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      {products.length > 1 && (
        <div className="absolute bottom-4 right-4 flex gap-1.5">
          {products.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-emerald-400" : "w-1.5 bg-slate-600"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
