import React from "react";
import { motion } from "framer-motion";
import { useI18n } from "@/providers/I18nProvider";

type TickerOrder = {
  orderId: number | string;
  orderNumber: string;
  total?: number;
  status: string;
  items?: Array<{ productName: string; quantity: number }>;
};

type OrderTickerProps = {
  orders: TickerOrder[];
  formatMoney: (n: number) => string;
};

export function OrderTicker({ orders, formatMoney }: OrderTickerProps) {
  const { t } = useI18n();
  const items =
    orders.length > 0
      ? orders
      : [{ orderId: 0, orderNumber: "—", status: "waiting", total: 0 }];

  const doubled = [...items, ...items];

  return (
    <div className="relative overflow-hidden border-y border-emerald-500/20 bg-black/60 py-2">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-gradient-to-r from-slate-950 to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-gradient-to-l from-slate-950 to-transparent" />

      <motion.div
        className="flex gap-12 whitespace-nowrap px-4 font-mono text-xs"
        animate={{ x: ["0%", "-50%"] }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        {doubled.map((order, i) => (
          <span key={`${order.orderId}-${i}`} className="inline-flex items-center gap-2 text-slate-300">
            <span className="text-emerald-400">●</span>
            <span className="font-bold text-white">#{order.orderNumber}</span>
            {order.total != null && order.total > 0 && (
              <span className="text-cyan-400">{formatMoney(order.total)}</span>
            )}
            <span className="text-slate-500">{order.status}</span>
          </span>
        ))}
      </motion.div>
      {orders.length === 0 && (
        <p className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-slate-600">
          {t("market.tickerWaiting")}
        </p>
      )}
    </div>
  );
}
