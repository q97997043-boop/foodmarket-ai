import React, { useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import {
  DollarSign,
  ShoppingBag,
  TrendingUp,
  AlertTriangle,
  Package,
} from "lucide-react";
import { trpc } from "../lib/trpc";
import { useRestaurant } from "../providers/RestaurantProvider";
import { ConnectionStatus } from "../components/ConnectionStatus";
import { BrandLogo } from "../components/BrandLogo";
import { useI18n } from "../providers/I18nProvider";
import { resolveImageSrc } from "../lib/media";
import { logInit } from "../lib/init-log";

export function Dashboard() {
  const { restaurant, restaurantId } = useRestaurant();
  const { t, currency, formatMoney } = useI18n();

  const { data, isLoading, isError } = trpc.dashboard.getOverview.useQuery(
    { restaurantId: restaurantId! },
    {
      enabled: !!restaurantId,
      refetchInterval: 30_000,
      retry: 1,
    },
  );

  useEffect(() => {
    logInit("dashboard", "mount", { restaurantId });
  }, [restaurantId]);

  useEffect(() => {
    if (data) {
      logInit("dashboard", "overview loaded", {
        orders: data.stats.totalOrders,
        revenue: data.stats.totalRevenue,
      });
    }
  }, [data]);

  const stats = data?.stats;
  const accent = restaurant?.themeColor ?? "#10b981";

  const statCards = [
    {
      label: t("dashboard.todayRevenue"),
      value: formatMoney(stats?.todayRevenue ?? 0),
      icon: DollarSign,
      color: "text-emerald-400",
    },
    {
      label: t("dashboard.todayOrders"),
      value: stats?.todayOrders ?? 0,
      icon: ShoppingBag,
      color: "text-cyan-400",
    },
    {
      label: t("dashboard.totalRevenue"),
      value: formatMoney(stats?.totalRevenue ?? 0),
      icon: TrendingUp,
      color: "text-violet-400",
    },
    {
      label: t("dashboard.pendingOrders"),
      value: stats?.pendingOrders ?? 0,
      icon: Package,
      color: "text-amber-400",
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 text-slate-50">
      {restaurant?.bannerUrl && (
        <div className="relative mb-0 h-36 overflow-hidden border-b border-emerald-500/20 md:h-44">
          <img src={restaurant.bannerUrl} alt="" className="h-full w-full object-cover opacity-80" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
        </div>
      )}
      <div className="p-4 md:p-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <BrandLogo
            logoUrl={restaurant?.logoUrl}
            name={restaurant?.name}
            size="lg"
            accent={accent}
          />
          <div>
            <h1 className="text-2xl font-bold text-white md:text-3xl">
              {restaurant?.name ?? t("common.appName")}
            </h1>
            <p className="text-sm text-slate-400">{t("dashboard.subtitle")}</p>
          </div>
        </div>
        <ConnectionStatus />
      </header>

      {!restaurantId ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center">
          <p className="text-lg text-slate-300">{t("dashboard.welcomeTitle")}</p>
          <p className="mt-2 text-sm text-slate-500">{t("dashboard.welcomeHint")}</p>
        </div>
      ) : isLoading ? (
        <p className="text-slate-500">{t("dashboard.loading")}</p>
      ) : (
        <>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {statCards.map((card) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 backdrop-blur-sm transition hover:border-slate-700"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-medium uppercase tracking-wider text-slate-500">
                      {card.label}
                    </span>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              );
            })}
          </div>

          <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="mb-4 text-lg font-semibold">{t("dashboard.revenueChart")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data?.revenueByDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                      formatter={(v) => formatMoney(Number(v ?? 0))}
                    />
                    <Bar dataKey="revenue" fill={accent} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
              <h2 className="mb-4 text-lg font-semibold">{t("dashboard.ordersChart")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.revenueByDay ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                    <YAxis stroke="#64748b" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "#0f172a",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      stroke="#22d3ee"
                      strokeWidth={2}
                      dot={{ fill: "#22d3ee" }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <section className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5 lg:col-span-2">
              <h2 className="mb-4 text-lg font-semibold">{t("dashboard.recentOrders")}</h2>
              <div className="space-y-2">
                {data?.recentOrders?.length === 0 && (
                  <p className="text-sm text-slate-500">{t("dashboard.noOrders")}</p>
                )}
                {data?.recentOrders?.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/50 px-4 py-3"
                  >
                    <div>
                      <p className="font-medium">#{order.orderNumber}</p>
                      <p className="text-xs text-slate-500">
                        {order.itemCount} {t("common.items")} ·{" "}
                        {t(`status.${order.status}` as "status.PENDING") || order.status}
                      </p>
                    </div>
                    <span className="font-semibold text-emerald-400">
                      {formatMoney(order.totalAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/40 p-5">
                <h2 className="mb-4 text-lg font-semibold">{t("dashboard.topSellers")}</h2>
                <div className="space-y-3">
                  {data?.topProducts?.map((p, i) => (
                    <div key={p.productId} className="flex items-center gap-3">
                      <span className="text-lg font-bold text-slate-600">
                        {i + 1}
                      </span>
                      {resolveImageSrc(p.imageUrl) ? (
                        <img
                          src={resolveImageSrc(p.imageUrl)}
                          alt=""
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      ) : (
                        <span className="text-xl">{p.emoji || "🍽️"}</span>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {t("dashboard.sold", { count: p.quantity })}
                        </p>
                      </div>
                    </div>
                  ))}
                  {!data?.topProducts?.length && (
                    <p className="text-sm text-slate-500">{t("dashboard.noSales")}</p>
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5">
                <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-400">
                  <AlertTriangle className="h-5 w-5" />
                  {t("dashboard.lowStock")}
                </h2>
                <div className="space-y-2">
                  {data?.lowStock?.map((p) => (
                    <div
                      key={p.id}
                      className="flex justify-between text-sm"
                    >
                      <span>{p.name}</span>
                      <span className="font-mono text-amber-400">
                        {t("dashboard.left", { count: p.stockQuantity })}
                      </span>
                    </div>
                  ))}
                  {!data?.lowStock?.length && (
                    <p className="text-sm text-slate-500">{t("dashboard.allStocked")}</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
