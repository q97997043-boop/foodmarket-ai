import React, { useMemo, useState } from "react";
import { ShoppingCart, Plus, Minus, Trash2, Search, X, Receipt } from "lucide-react";
import { clsx } from "clsx";
import { trpc } from "../lib/trpc";
import { useRestaurant } from "../providers/RestaurantProvider";
import { ProductCard } from "../components/ProductCard";
import { useI18n } from "../providers/I18nProvider";
import { resolveImageSrc } from "../lib/media";

type CartItem = {
  product: {
    id: string;
    name: string;
    currentPrice: number;
    imageUrl?: string | null;
    emoji?: string | null;
  };
  quantity: number;
  notes?: string;
};

export function POS() {
  const { restaurant, restaurantId } = useRestaurant();
  const { t, currency, formatMoney } = useI18n();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<string | "all">("all");
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "card" | "mixed">("cash");
  const [cashAmount, setCashAmount] = useState<number | undefined>(undefined);
  const [cardAmount, setCardAmount] = useState<number | undefined>(undefined);
  const [showCheckout, setShowCheckout] = useState(false);
  const [receiptOrder, setReceiptOrder] = useState<{
    orderNumber: number;
    total: number;
    paymentMethod: string;
    customerName?: string;
    tableNumber?: string;
  } | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const { data: products, isLoading } = trpc.menu.getProducts.useQuery(
    {
      restaurantId: restaurantId!,
      availableOnly: true,
      search: search || undefined,
      categoryId: categoryId === "all" ? undefined : categoryId,
    },
    { enabled: !!restaurantId },
  );

  const { data: categories } = trpc.menu.getCategories.useQuery(
    { restaurantId: restaurantId! },
    { enabled: !!restaurantId },
  );

  const createOrder = trpc.orders.create.useMutation({
    onSuccess(data) {
      setReceiptOrder({
        orderNumber: data.orderNumber,
        total: data.total,
        paymentMethod:
          paymentMethod === "mixed"
            ? `${t("pos.mixed")}: ${formatMoney(cashAmount ?? 0)} / ${formatMoney(
                cardAmount ?? 0,
              )}`
            : paymentMethod === "cash"
            ? t("pos.cash")
            : t("pos.card"),
        customerName: customerName || undefined,
        tableNumber: tableNumber || undefined,
      });
      setCart([]);
      setPaymentMethod("cash");
      setCustomerName("");
      setTableNumber("");
    },
  });

  const addToCart = (product: NonNullable<typeof products>[0]) => {
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 400);
    setCart((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [
        ...prev,
        {
          product: {
            id: product.id,
            name: product.name,
            currentPrice: product.currentPrice,
            imageUrl: product.imageUrl,
            emoji: product.emoji,
          },
          quantity: 1,
          notes: "",
        },
      ];
    });
  };

  const updateQty = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.product.id === id ? { ...i, quantity: i.quantity + delta } : i,
        )
        .filter((i) => i.quantity > 0),
    );
  };

  const updateItemNotes = (id: string, notes: string) => {
    setCart((prev) => prev.map((i) => (i.product.id === id ? { ...i, notes } : i)));
  };

  const subtotal = cart.reduce(
    (s, i) => s + i.product.currentPrice * i.quantity,
    0,
  );
  const tax = Math.round(subtotal * (restaurant?.taxPercent ?? 0.12));
  const serviceFee = Math.round(subtotal * (restaurant?.serviceFeePercent ?? 0));
  const total = subtotal + tax + serviceFee;

  const handleCheckout = () => {
    if (!restaurantId || cart.length === 0) return;
    createOrder.mutate({
      restaurantId,
      customerName: customerName || undefined,
      tableNumber: tableNumber || undefined,
      source: "pos",
      // persist per-item notes as a JSON string in the order.notes field
      notes: JSON.stringify(
        cart.map((i) => ({ productId: i.product.id, notes: i.notes ?? "" })),
      ),
      items: cart.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
    });
  };

  const bannerStyle = useMemo(
    () => ({
      borderColor: `${restaurant?.themeColor ?? "#10b981"}33`,
    }),
    [restaurant?.themeColor],
  );

  return (
    <div className="flex h-full flex-col bg-slate-950 text-slate-50 lg:flex-row">
      <div className="flex flex-1 flex-col overflow-hidden">
        {restaurant?.bannerUrl && (
          <div className="relative h-24 shrink-0 overflow-hidden border-b border-slate-800">
            <img
              src={restaurant.bannerUrl}
              alt=""
              className="h-full w-full object-cover opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/50 to-transparent" />
            <div className="absolute bottom-3 left-4 flex items-center gap-3">
              {restaurant.logoUrl && (
                <img
                  src={restaurant.logoUrl}
                  alt=""
                  className="h-12 w-12 rounded-xl border border-slate-700 object-cover"
                />
              )}
              <div>
                <h1 className="text-lg font-bold">{restaurant.name}</h1>
                <p className="text-xs text-emerald-400">{t("pos.badge")}</p>
              </div>
            </div>
          </div>
        )}

        <div className="border-b border-slate-800 p-4" style={bannerStyle}>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("pos.searchPlaceholder")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 py-2.5 pl-10 pr-4 text-sm focus:border-emerald-500 focus:outline-none"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => setCategoryId("all")}
              className={clsx(
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                categoryId === "all"
                  ? "bg-emerald-500 text-emerald-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700",
              )}
            >
              {t("common.all")}
            </button>
            {categories?.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className={clsx(
                  "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition",
                  categoryId === c.id
                    ? "bg-emerald-500 text-emerald-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700",
                )}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <p className="text-slate-500">{t("pos.loadingMenu")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
              {products?.map((product) => (
                <div
                  key={product.id}
                  className={clsx(
                    "transition-transform duration-300",
                    addedId === product.id && "animate-cart-pop",
                  )}
                >
                  <ProductCard
                    product={product}
                    currency={currency}
                    compact
                    onAdd={() => addToCart(product)}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <aside className="flex w-full flex-col border-t border-slate-800 bg-slate-900 lg:w-96 lg:border-l lg:border-t-0">
        <div className="flex items-center gap-3 border-b border-slate-800 p-4">
          <ShoppingCart className="h-5 w-5 text-emerald-500" />
          <h2 className="text-xl font-bold">{t("pos.cart", { count: cart.length })}</h2>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {cart.length === 0 ? (
              <p className="py-12 text-center text-slate-500">{t("pos.cartEmpty")}</p>
            ) : (
              cart.map((item) => (
                <div
                  key={item.product.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950 p-3"
                >
                  {resolveImageSrc(item.product.imageUrl) ? (
                    <img
                      src={resolveImageSrc(item.product.imageUrl)}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{item.product.emoji || "🍽️"}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{item.product.name}</p>
                    <p className="text-xs text-slate-400">
                      {formatMoney(item.product.currentPrice)}
                    </p>
                    <input
                      value={item.notes ?? ""}
                      onChange={(e) => updateItemNotes(item.product.id, e.target.value)}
                      placeholder={t("pos.itemNotesPlaceholder")}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-900 px-2 py-1 text-xs text-slate-300"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateQty(item.product.id, -1)}
                      className="rounded-lg bg-slate-800 p-1.5"
                    >
                      {item.quantity === 1 ? (
                        <Trash2 className="h-4 w-4 text-red-400" />
                      ) : (
                        <Minus className="h-4 w-4" />
                      )}
                    </button>
                    <span className="w-6 text-center font-bold">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product.id, 1)}
                      className="rounded-lg bg-slate-800 p-1.5"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
        </div>

        <div className="space-y-3 border-t border-slate-800 bg-slate-950 p-4">
          <div className="flex justify-between text-sm text-slate-400">
            <span>{t("pos.subtotal")}</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-slate-400">
            <span>{t("pos.tax", { percent: Math.round((restaurant?.taxPercent ?? 0.12) * 100) })}</span>
            <span>{formatMoney(tax)}</span>
          </div>
          {serviceFee > 0 && (
            <div className="flex justify-between text-sm text-slate-400">
              <span>{t("pos.serviceFee", { percent: Math.round((restaurant?.serviceFeePercent ?? 0) * 100) })}</span>
              <span>{formatMoney(serviceFee)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-slate-800 pt-2 text-lg font-bold">
            <span>{t("pos.total")}</span>
            <span style={{ color: restaurant?.themeColor ?? "#34d399" }}>
              {formatMoney(total)}
            </span>
          </div>
          <button
            disabled={cart.length === 0}
            onClick={() => setShowCheckout(true)}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-3.5 font-bold text-emerald-950 shadow-[0_0_24px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:opacity-40"
          >
            <Receipt className="h-5 w-5" />
            {t("pos.checkout")}
          </button>
        </div>
      </aside>

      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md animate-fade-in rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">{t("pos.completeOrder")}</h3>
              <button onClick={() => setShowCheckout(false)}>
                <X className="h-6 w-6 text-slate-400" />
              </button>
            </div>
            {receiptOrder ? (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-700 bg-slate-950 p-4 text-center">
                  <p className="text-sm uppercase tracking-[0.25em] text-slate-400">
                    {t("pos.orderSuccess", { orderNumber: receiptOrder.orderNumber })}
                  </p>
                  <p className="mt-3 text-4xl font-bold text-emerald-400">
                    {formatMoney(receiptOrder.total)}
                  </p>
                  <p className="mt-2 text-sm text-slate-400">
                    {receiptOrder.paymentMethod}
                  </p>
                </div>
                <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 text-sm text-slate-400">
                  <p>
                    {t("pos.customerName")}: {receiptOrder.customerName || t("common.none")}
                  </p>
                  <p>
                    {t("pos.tableNumber")}: {receiptOrder.tableNumber || t("common.none")}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowCheckout(false);
                    setReceiptOrder(null);
                  }}
                  className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-emerald-950 hover:bg-emerald-400"
                >
                  {t("common.close")}
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 rounded-xl border border-dashed border-slate-700 bg-slate-950 p-4 font-mono text-sm">
                  <p className="text-center text-lg font-bold text-emerald-400">
                    {restaurant?.name}
                  </p>
                  <p className="mt-2 text-center text-2xl font-bold">
                    {formatMoney(total)}
                  </p>
                  <hr className="my-3 border-slate-800" />
                  {cart.map((i) => (
                    <div key={i.product.id} className="flex justify-between py-1">
                      <span>
                        {i.quantity}x {i.product.name}
                      </span>
                      <span>
                        {formatMoney(i.product.currentPrice * i.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 rounded-3xl border border-slate-800 bg-slate-950 p-4">
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">
                    {t("pos.paymentMethod")}
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {(["cash", "card", "mixed"] as const).map((method) => (
                      <button
                        key={method}
                        type="button"
                        onClick={() => setPaymentMethod(method)}
                        className={clsx(
                          "rounded-2xl border px-4 py-3 text-sm font-semibold transition",
                          paymentMethod === method
                            ? "border-emerald-500 bg-emerald-500/10 text-emerald-200"
                            : "border-slate-700 bg-slate-900 text-slate-300 hover:border-emerald-500/60 hover:text-white",
                        )}
                      >
                        {t(`pos.${method}`)}
                      </button>
                    ))}
                  </div>
                  {paymentMethod === "mixed" && (
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <input
                        type="number"
                        value={cashAmount ?? ""}
                        onChange={(e) => setCashAmount(Number(e.target.value || 0))}
                        placeholder={t("pos.cashAmount")}
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                      />
                      <input
                        type="number"
                        value={cardAmount ?? ""}
                        onChange={(e) => setCardAmount(Number(e.target.value || 0))}
                        placeholder={t("pos.cardAmount")}
                        className="rounded-2xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200"
                      />
                    </div>
                  )}
                </div>
                {createOrder.error && (
                  <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
                    {(createOrder.error as any)?.message || t("errors.requestFailed", { status: "" })}
                  </div>
                )}
                <button
                  onClick={handleCheckout}
                  disabled={createOrder.isLoading}
                  className="w-full rounded-xl bg-emerald-500 py-3 font-bold text-emerald-950 hover:bg-emerald-400 disabled:opacity-50"
                >
                  {createOrder.isLoading ? t("pos.processing") : t("pos.confirmPrint")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
