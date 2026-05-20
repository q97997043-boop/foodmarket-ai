import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { QrCode } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useI18n } from "@/providers/I18nProvider";
import { resolveImageSrc } from "@/lib/media";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function QrMenu() {
  const { slug } = useParams<{ slug: string }>();
  const { t, formatMoney } = useI18n();
  const [categoryId, setCategoryId] = useState<string | "all">("all");

  const { data, isLoading, isError } = trpc.market.getPublicMenu.useQuery(
    { slug: slug ?? "" },
    { enabled: !!slug },
  );

  const menuUrl = typeof window !== "undefined" ? window.location.href : "";

  const sanitizedName = (name: string | undefined | null) => {
    if (!name) return "FoodMarket AI";
    if (/test|demo/i.test(name)) return "FoodMarket AI";
    return name;
  };

  const filtered = useMemo(() => {
    if (!data) return [] as Array<any>;
    if (categoryId === "all") return data.products as Array<any>;
    return data.products.filter((p: any) => p.categoryId === categoryId);
  }, [data, categoryId]);

  const [cart, setCart] = useState<
    { productId: string; name: string; quantity: number; price: number }[]
  >([]);

  const addToCart = (p: any) => {
    setCart((s) => {
      const found = s.find((x) => x.productId === p.id);
      if (found) {
        return s.map((x) => (x.productId === p.id ? { ...x, quantity: x.quantity + 1 } : x));
      }
      return [...s, { productId: p.id, name: p.name, quantity: 1, price: p.currentPrice }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((s) => s.filter((x) => x.productId !== productId));
  };

  const createOrder = trpc.market.createPublicOrder.useMutation();

  const placeOrder = async () => {
    if (!data) return;
    if (cart.length === 0) return;
    try {
      await createOrder.mutateAsync({
        restaurantId: data.id,
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
        source: "qr",
      } as any);
      setCart([]);
      alert("Order placed — thanks!");
    } catch (err: any) {
      alert(err?.message || "Failed to place order");
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
        {t("common.loading")}
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-red-400">
        {t("market.menuNotFound")}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {data.bannerUrl && (
        <div className="relative h-40 overflow-hidden md:h-52">
          <img src={data.bannerUrl} alt="" className="h-full w-full object-cover opacity-70" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>
      )}

      <header className="border-b border-slate-800 px-4 py-6 md:px-8">
        <div className="mx-auto flex max-w-3xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              {data.logoUrl ? (
                <img
                  src={data.logoUrl}
                  alt=""
                  className="h-16 w-16 rounded-2xl border border-emerald-500/30 object-cover"
                />
              ) : (
                <div
                  className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-bold"
                  style={{ backgroundColor: `${data.themeColor}22`, color: data.themeColor }}
                >
                  FM
                </div>
              )}
              <div>
                <h1 className="text-2xl font-bold">{sanitizedName(data.name)}</h1>
                <p className="text-sm text-emerald-400">{t("market.qrMenu")}</p>
                {(data.taxPercent || data.serviceFeePercent) && (
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-400">
                    {data.taxPercent ? (
                      <span>{t("pos.tax", { percent: Math.round(data.taxPercent * 100) })}</span>
                    ) : null}
                    {data.serviceFeePercent ? (
                      <span>{t("pos.serviceFee", { percent: Math.round(data.serviceFeePercent * 100) })}</span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>
          <LanguageSwitcher variant="compact" />
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-6 md:px-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCategoryId("all")}
            className={`rounded-full px-4 py-1.5 text-sm font-medium ${
              categoryId === "all"
                ? "bg-emerald-500 text-emerald-950"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {t("common.all")}
          </button>
          {data.categories.map((c: any) => (
            <button
              key={c.id}
              type="button"
              onClick={() => setCategoryId(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-medium ${
                categoryId === c.id
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-slate-800 text-slate-300"
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="space-y-4">
          {filtered.map((p: any, i: number) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4"
              onClick={() => addToCart(p)}
              role="button"
              tabIndex={0}
            >
              {resolveImageSrc(p.imageUrl) ? (
                <img
                  src={resolveImageSrc(p.imageUrl)}
                  alt=""
                  className="h-20 w-20 rounded-xl object-cover"
                />
              ) : (
                <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-slate-800 text-3xl">
                  {p.emoji || "🍽️"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.isHot && (
                    <span className="shrink-0 rounded bg-rose-500/20 px-2 py-0.5 text-[10px] font-bold text-rose-400">
                      HOT
                    </span>
                  )}
                </div>
                {p.description && (
                  <p className="mt-1 text-sm text-slate-400 line-clamp-2">{p.description}</p>
                )}
                <p className="mt-2 font-mono text-lg font-bold text-emerald-400">
                  {formatMoney(p.currentPrice)}
                </p>
              </div>
              <div className="flex items-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    addToCart(p);
                  }}
                  className="ml-2 rounded bg-emerald-500/20 px-3 py-1 text-sm text-emerald-300"
                >
                  {t("market.add") || "Add"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        <section className="mt-10 rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-6 text-center">
          <QrCode className="mx-auto h-12 w-12 text-emerald-500/60" />
          <p className="mt-3 text-sm text-slate-400">{t("market.scanQr")}</p>
          <p className="mt-2 break-all font-mono text-xs text-slate-500">{menuUrl}</p>
        </section>

        {cart.length > 0 && (
          <div className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-3xl">
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
              <div>
                <div className="font-semibold">{cart.reduce((s, c) => s + c.quantity, 0)} items</div>
                <div className="text-sm text-slate-400">{formatMoney(cart.reduce((s, c) => s + c.price * c.quantity, 0))}</div>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setCart([])} className="rounded bg-slate-700 px-3 py-2 text-sm">
                  {t("common.clear")}
                </button>
                <button type="button" onClick={placeOrder} className="rounded bg-emerald-500 px-4 py-2 text-sm font-bold text-emerald-950">
                  {createOrder.isLoading ? t("common.placing") : t("market.placeOrder") || "Place order"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
