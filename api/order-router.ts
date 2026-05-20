import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { prisma } from "./prisma-client";
import { assertRestaurantAccess } from "./lib/access";
import { emitOrderCreated, emitOrderUpdated } from "./realtime/broadcaster";
import { nextOrderNumber } from "./lib/ids";
import { applyOrderDemandBoost } from "./lib/ai-pricing";

export const orderRouter = createRouter({
  list: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        status: z.string().optional(),
        limit: z.number().default(50),
      }),
    )
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      return prisma.order.findMany({
        where: {
          restaurantId: input.restaurantId,
          ...(input.status ? { status: input.status } : {}),
        },
        include: { orderItems: { include: { product: true } } },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  create: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        customerName: z.string().optional(),
        tableNumber: z.string().optional(),
        notes: z.string().optional(),
        source: z.string().default("pos"),
        items: z
          .array(
            z.object({
              productId: z.string(),
              quantity: z.number().min(1),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: input.restaurantId },
      });
      if (!restaurant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
      }

      let subtotal = 0;
      const lineItems: {
        productId: string;
        quantity: number;
        priceAtPurchase: number;
        productName: string;
      }[] = [];

      for (const item of input.items) {
        const product = await prisma.product.findFirst({
          where: { id: item.productId, restaurantId: input.restaurantId },
        });
        if (!product || !product.isAvailable) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Product unavailable: ${item.productId}`,
          });
        }
        if (product.stockQuantity < item.quantity) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Insufficient stock for ${product.name}`,
          });
        }

        const unitPrice = product.currentPrice;
        subtotal += unitPrice * item.quantity;
        lineItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtPurchase: unitPrice,
          productName: product.name,
        });

        await prisma.product.update({
          where: { id: product.id },
          data: { stockQuantity: { decrement: item.quantity } },
        });

        await applyOrderDemandBoost(restaurant.legacyId, product, item.quantity);
      }

      const tax = Math.round(subtotal * restaurant.taxPercent);
      const serviceFee = Math.round(subtotal * restaurant.serviceFeePercent);
      const total = subtotal + tax + serviceFee;

      const orderNumber = await nextOrderNumber(input.restaurantId);

      const order = await prisma.order.create({
        data: {
          restaurantId: input.restaurantId,
          orderNumber,
          subtotal,
          tax,
          serviceFee,
          totalAmount: total,
          status: "CONFIRMED",
          source: input.source,
          customerName: input.customerName,
          tableNumber: input.tableNumber,
          notes: input.notes,
          orderItems: {
            create: lineItems.map((li) => ({
              productId: li.productId,
              quantity: li.quantity,
              priceAtPurchase: li.priceAtPurchase,
              productName: li.productName,
            })),
          },
        },
        include: { orderItems: true },
      });

      emitOrderCreated({
        restaurantId: restaurant.legacyId,
        orderId: order.orderNumber,
        orderNumber: String(order.orderNumber),
        source: input.source,
        total,
        subtotal,
        tax,
        notes: input.notes,
        tableNumber: input.tableNumber,
        customerName: input.customerName,
        items: lineItems.map((li) => ({
          productId: li.productId,
          productName: li.productName,
          quantity: li.quantity,
          unitPrice: li.priceAtPurchase,
          totalPrice: li.priceAtPurchase * li.quantity,
        })),
        createdAt: order.createdAt.toISOString(),
      });

      return {
        success: true,
        orderId: order.id,
        orderNumber: order.orderNumber,
        total,
      };
    }),

  updateStatus: authedQuery
    .input(
      z.object({
        orderNumber: z.number(),
        restaurantId: z.string(),
        status: z.enum([
          "PENDING",
          "CONFIRMED",
          "PREPARING",
          "READY",
          "SERVED",
          "COMPLETED",
          "CANCELLED",
        ]),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const restaurant = await prisma.restaurant.findUnique({
        where: { id: input.restaurantId },
      });
      if (!restaurant) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const order = await prisma.order.updateMany({
        where: {
          orderNumber: input.orderNumber,
          restaurantId: input.restaurantId,
        },
        data: { status: input.status },
      });

      if (order.count === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Order not found" });
      }

      emitOrderUpdated(
        restaurant.legacyId,
        input.orderNumber,
        String(input.orderNumber),
        input.status.toLowerCase(),
      );

      return { success: true };
    }),

  getRecent: authedQuery
    .input(
      z.object({ restaurantId: z.string(), limit: z.number().default(20) }),
    )
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      return prisma.order.findMany({
        where: { restaurantId: input.restaurantId },
        include: { orderItems: true },
        orderBy: { createdAt: "desc" },
        take: input.limit,
      });
    }),

  getStats: authedQuery
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const orders = await prisma.order.findMany({
        where: {
          restaurantId: input.restaurantId,
          status: { not: "CANCELLED" },
        },
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayOrders = orders.filter((o) => o.createdAt >= today);
      const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
      const todayRevenue = todayOrders.reduce((s, o) => s + o.totalAmount, 0);

      return {
        totalOrders: orders.length,
        todayOrders: todayOrders.length,
        totalRevenue: String(totalRevenue),
        todayRevenue: String(todayRevenue),
        averageOrderValue:
          orders.length > 0 ? String(totalRevenue / orders.length) : "0",
        pendingOrders: orders.filter(
          (o) => o.status === "PENDING" || o.status === "PREPARING",
        ).length,
      };
    }),
});
