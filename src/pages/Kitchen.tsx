import React, { useEffect } from "react";
import { Clock, CheckCircle2, ChevronRight } from "lucide-react";
import { clsx } from "clsx";
import { trpc } from "../lib/trpc";
import { useRestaurant } from "../providers/RestaurantProvider";
import { useI18n } from "../providers/I18nProvider";
import { useRealtimeMarket } from "../hooks/useRealtimeMarket";

export function Kitchen() {
  const { t } = useI18n();
  const { restaurantId, legacyId } = useRestaurant();
  const { orders, newOrderCount, resetNewOrderCount } = useRealtimeMarket(legacyId);
  const updateStatus = trpc.orders.updateStatus.useMutation();

  const { data: dbOrders } = trpc.orders.list.useQuery(
    {
      restaurantId: restaurantId!,
      limit: 30,
    },
    { enabled: !!restaurantId, refetchInterval: 10_000 },
  );

  const activeFromDb =
    dbOrders?.filter((o) =>
      ["PENDING", "CONFIRMED", "PREPARING", "READY"].includes(o.status),
    ) ?? [];

  const activeOrders =
    orders.length > 0
      ? orders.filter((o) =>
          ["pending", "confirmed", "preparing", "ready"].includes(o.status),
        )
      : activeFromDb.map((o) => {
          let parsedNotes: Array<{ productId: string; notes: string }> | null = null;
          try {
            parsedNotes = o.notes ? JSON.parse(o.notes) : null;
          } catch (e) {
            parsedNotes = null;
          }

          return {
            orderId: o.orderNumber,
            orderNumber: String(o.orderNumber),
            status: o.status.toLowerCase(),
            createdAt: o.createdAt,
            items:
              o.orderItems?.map((i) => ({
                productName:
                  i.productName ?? i.product?.name ?? t("kitchen.itemFallback"),
                quantity: i.quantity,
                notes:
                  parsedNotes?.find((n) => n.productId === i.productId)?.notes ?? undefined,
              })) ?? [],
          };
        });

  const handleUpdateStatus = (orderNumber: number, currentStatus: string) => {
    if (!restaurantId) return;
    let nextStatus: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "CANCELLED" =
      "PREPARING";
    if (currentStatus === "pending" || currentStatus === "confirmed") {
      nextStatus = "PREPARING";
    } else if (currentStatus === "preparing") {
      nextStatus = "READY";
    } else if (currentStatus === "ready") {
      nextStatus = "SERVED";
    }
    updateStatus.mutate({ orderNumber, restaurantId, status: nextStatus });
  };

  // Play a short beep when a new order arrives.
  useEffect(() => {
    if (!newOrderCount || newOrderCount <= 0) return;

    try {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.type = "sine";
      o.frequency.value = 880;
      g.gain.value = 0.05;
      o.start();
      setTimeout(() => {
        o.stop();
        try {
          ctx.close();
        } catch {}
      }, 160);
    } catch (e) {
      // ignore audio failure
    }

    // reset counter so we only play once per burst
    resetNewOrderCount();
  }, [newOrderCount, resetNewOrderCount]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 p-6">
      <header className="mb-8 flex items-center justify-between">
        <h1 className="flex items-center gap-3 text-3xl font-bold text-white">
          <span className="text-orange-500">🔥</span> {t("kitchen.title")}
        </h1>
        <div className="rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-slate-400">
          {t("kitchen.active")}:{" "}
          <span className="font-bold text-white">{activeOrders.length}</span>
        </div>
      </header>

      {activeOrders.length === 0 ? (
        <div className="flex h-64 flex-col items-center justify-center rounded-xl border border-dashed border-slate-800 text-slate-500">
          <CheckCircle2 className="mb-4 h-12 w-12 text-slate-700" />
          <p>{t("kitchen.allCaughtUp")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
          {activeOrders.map((order) => {
            const isPreparing = order.status === "preparing";
            const isReady = order.status === "ready";
            const elapsedMins = Math.floor(
              (Date.now() - new Date(order.createdAt).getTime()) / 60000,
            );
            const isLate = elapsedMins > 10;

            return (
              <div
                key={order.orderId}
                className={clsx(
                  "flex flex-col overflow-hidden rounded-xl border bg-slate-900",
                  isLate ? "border-red-500/50" : "border-slate-800",
                  isPreparing && !isLate && "border-orange-500/50",
                  isReady && !isLate && "border-emerald-500/50",
                )}
              >
                <div
                  className={clsx(
                    "flex justify-between border-b p-4",
                    isLate
                      ? "border-red-500/20 bg-red-500/10"
                      : "border-slate-800 bg-slate-800/50",
                  )}
                >
                  <div>
                    <h3 className="text-lg font-bold">#{order.orderNumber}</h3>
                    <div className="mt-1 flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="h-4 w-4" />
                      {elapsedMins} {t("common.min")}
                    </div>
                  </div>
                  <span
                    className={clsx(
                      "rounded-full px-3 py-1 text-xs font-bold uppercase",
                      isReady
                        ? "bg-emerald-500/20 text-emerald-400"
                        : isPreparing
                        ? "bg-orange-500/20 text-orange-400"
                        : "bg-blue-500/20 text-blue-400",
                    )}
                  >
                    {t(`status.${order.status}` as "status.pending") || order.status}
                  </span>
                </div>
                <div className="flex-1 space-y-2 p-4">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-lg font-bold text-emerald-400">
                        {item.quantity}x
                      </span>
                      <div>
                        <p className="text-lg">{item.productName}</p>
                        {((item as any).notes ?? null) && (
                          <p className="mt-1 text-sm text-slate-400">{(item as any).notes}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border-t border-slate-800 p-4">
                  <button
                    onClick={() =>
                      handleUpdateStatus(
                        typeof order.orderId === "number"
                          ? order.orderId
                          : parseInt(String(order.orderNumber)),
                        order.status,
                      )
                    }
                    disabled={updateStatus.isLoading}
                    className={clsx(
                      "flex w-full items-center justify-center gap-2 rounded-lg py-3 font-bold",
                      isReady
                        ? "bg-slate-600 text-slate-100"
                        : isPreparing
                        ? "bg-emerald-500 text-emerald-950"
                        : "bg-orange-500 text-orange-950",
                    )}
                  >
                    {isReady
                      ? t("kitchen.markServed")
                      : isPreparing
                      ? t("kitchen.markReady")
                      : t("kitchen.startPreparing")}
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
