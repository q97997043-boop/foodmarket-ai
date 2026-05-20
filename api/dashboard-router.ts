import { z } from "zod";
import { createRouter, authedQuery } from "./middleware";
import { prisma } from "./prisma-client";
import { assertRestaurantAccess } from "./lib/access";

export const dashboardRouter = createRouter({
  getOverview: authedQuery
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const [allOrders, products, recentOrders] = await Promise.all([
        prisma.order.findMany({
          where: {
            restaurantId: input.restaurantId,
            status: { not: "CANCELLED" },
          },
          include: { orderItems: true },
        }),
        prisma.product.findMany({
          where: { restaurantId: input.restaurantId },
          include: { category: true },
        }),
        prisma.order.findMany({
          where: { restaurantId: input.restaurantId },
          include: {
            orderItems: { include: { product: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 8,
        }),
      ]);

      const todayOrders = allOrders.filter((o) => o.createdAt >= todayStart);
      const totalRevenue = allOrders.reduce((s, o) => s + o.totalAmount, 0);
      const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

      const productSales = new Map<string, { name: string; qty: number; revenue: number; imageUrl?: string | null; emoji?: string | null }>();
      for (const order of allOrders) {
        for (const item of order.orderItems) {
          const key = item.productId;
          const cur = productSales.get(key) ?? {
            name: item.productName ?? "Item",
            qty: 0,
            revenue: 0,
          };
          cur.qty += item.quantity;
          cur.revenue += item.priceAtPurchase * item.quantity;
          productSales.set(key, cur);
        }
      }

      const topProducts = [...productSales.entries()]
        .map(([productId, data]) => {
          const p = products.find((x) => x.id === productId);
          return {
            productId,
            name: p?.name ?? data.name,
            quantity: data.qty,
            revenue: data.revenue,
            imageUrl: p?.imageUrl,
            emoji: p?.emoji,
          };
        })
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 5);

      const lowStock = products
        .filter((p) => p.stockQuantity <= 10)
        .map((p) => ({
          id: p.id,
          name: p.name,
          stockQuantity: p.stockQuantity,
          imageUrl: p.imageUrl,
          emoji: p.emoji,
        }))
        .slice(0, 6);

      const revenueByDay: { date: string; revenue: number; orders: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        const dayOrders = allOrders.filter(
          (o) => o.createdAt >= d && o.createdAt < next,
        );
        revenueByDay.push({
          date: d.toLocaleDateString("en-US", { weekday: "short" }),
          revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
          orders: dayOrders.length,
        });
      }

      return {
        stats: {
          totalOrders: allOrders.length,
          todayOrders: todayOrders.length,
          totalRevenue,
          todayRevenue,
          averageOrderValue:
            allOrders.length > 0 ? totalRevenue / allOrders.length : 0,
          pendingOrders: allOrders.filter(
            (o) =>
              o.status === "PENDING" ||
              o.status === "PREPARING" ||
              o.status === "CONFIRMED",
          ).length,
        },
        topProducts,
        lowStock,
        revenueByDay,
        recentOrders: recentOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          status: o.status,
          totalAmount: o.totalAmount,
          customerName: o.customerName,
          tableNumber: o.tableNumber,
          createdAt: o.createdAt.toISOString(),
          itemCount: o.orderItems.reduce((s, i) => s + i.quantity, 0),
        })),
      };
    }),
});
