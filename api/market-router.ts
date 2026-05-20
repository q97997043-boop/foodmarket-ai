import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { publicProcedure } from "./trpc";
import { prisma } from "./prisma-client";
import { assertRestaurantAccess } from "./lib/access";
import {
  buildPredictions,
  buildRecommendations,
} from "./lib/ai-pricing";
import { productIdHash } from "./lib/product-id-hash";
import { emitOrderCreated } from "./realtime/broadcaster";
import { nextOrderNumber } from "./lib/ids";

export const marketRouter = createRouter({
  getSnapshot: authedQuery
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const products = await prisma.product.findMany({
        where: { restaurantId: input.restaurantId, isAvailable: true },
        include: { category: true },
        orderBy: { sortOrder: "asc" },
      });

      const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const recentItems = await prisma.orderItem.findMany({
        where: {
          order: {
            restaurantId: input.restaurantId,
            createdAt: { gte: hourAgo },
            status: { not: "CANCELLED" },
          },
        },
        select: { productId: true, quantity: true },
      });

      const hourlyOrders = new Map<string, number>();
      for (const item of recentItems) {
        hourlyOrders.set(
          item.productId,
          (hourlyOrders.get(item.productId) ?? 0) + item.quantity,
        );
      }

      const heatmap = products.map((p) => {
        const hourly = hourlyOrders.get(p.id) ?? 0;
        const priceDelta =
          p.basePrice > 0
            ? ((p.currentPrice - p.basePrice) / p.basePrice) * 100
            : 0;
        const heat = Math.min(
          100,
          Math.max(
            5,
            25 + hourly * 10 + priceDelta * 0.5 + (p.isHot ? 20 : 0),
          ),
        );
        return {
          productId: p.id,
          legacyProductId: productIdHash(p.id),
          name: p.name,
          emoji: p.emoji,
          imageUrl: p.imageUrl,
          category: p.category?.name,
          currentPrice: p.currentPrice,
          basePrice: p.basePrice,
          changePercent: priceDelta,
          heat,
          hourlyOrders: hourly,
          stockQuantity: p.stockQuantity,
          isHot: p.isHot,
        };
      });

      const heatMapForRecs = new Map(heatmap.map((h) => [h.productId, h.heat]));

      return {
        products: heatmap,
        predictions: buildPredictions(products, hourlyOrders),
        recommendations: buildRecommendations(products, heatMapForRecs),
        updatedAt: new Date().toISOString(),
      };
    }),

  getChartData: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        productId: z.string().optional(),
        hours: z.number().min(1).max(168).default(24),
      }),
    )
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const since = new Date(Date.now() - input.hours * 60 * 60 * 1000);

      const history = await prisma.priceHistory.findMany({
        where: {
          timestamp: { gte: since },
          product: {
            restaurantId: input.restaurantId,
            ...(input.productId ? { id: input.productId } : {}),
          },
        },
        include: { product: { select: { id: true, name: true, emoji: true } } },
        orderBy: { timestamp: "asc" },
        take: 500,
      });

      const byProduct = new Map<
        string,
        { name: string; emoji: string | null; points: Array<{ t: string; price: number }> }
      >();

      for (const row of history) {
        if (!byProduct.has(row.productId)) {
          byProduct.set(row.productId, {
            name: row.product.name,
            emoji: row.product.emoji,
            points: [],
          });
        }
        byProduct.get(row.productId)!.points.push({
          t: row.timestamp.toISOString(),
          price: row.price,
        });
      }

      const series = [...byProduct.entries()].map(([id, data]) => ({
        productId: id,
        legacyProductId: productIdHash(id),
        ...data,
      }));

      if (series.length === 0) {
        const products = await prisma.product.findMany({
          where: {
            restaurantId: input.restaurantId,
            ...(input.productId ? { id: input.productId } : {}),
          },
          take: 12,
        });
        const now = new Date().toISOString();
        return {
          series: products.map((p) => ({
            productId: p.id,
            legacyProductId: productIdHash(p.id),
            name: p.name,
            emoji: p.emoji,
            points: [
              { t: now, price: p.basePrice },
              { t: now, price: p.currentPrice },
            ],
          })),
        };
      }

      return { series };
    }),

  getPublicMenu: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const restaurant = await prisma.restaurant.findUnique({
        where: { slug: input.slug, isActive: true },
        include: {
          categories: { orderBy: { sortOrder: "asc" } },
          products: {
            where: { isAvailable: true },
            orderBy: { sortOrder: "asc" },
            include: { category: true },
          },
        },
      });

      if (!restaurant) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
      }

      return {
        id: restaurant.id,
        legacyId: restaurant.legacyId,
        name: restaurant.name,
        slug: restaurant.slug,
        logoUrl: restaurant.logoUrl,
        bannerUrl: restaurant.bannerUrl,
        currency: restaurant.currency,
        themeColor: restaurant.themeColor,
        taxPercent: restaurant.taxPercent,
        serviceFeePercent: restaurant.serviceFeePercent,
        categories: restaurant.categories,
        bio: restaurant.bio,
        products: restaurant.products.map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          emoji: p.emoji,
          imageUrl: p.imageUrl,
          currentPrice: p.currentPrice,
          categoryId: p.categoryId,
          categoryName: p.category?.name,
          isHot: p.isHot,
        })),
      };
    }),

  createPublicOrder: publicProcedure
    .input(
      z.object({
        restaurantId: z.string(),
        customerName: z.string().optional(),
        tableNumber: z.string().optional(),
        notes: z.string().optional(),
        items: z
          .array(
            z.object({ productId: z.string(), quantity: z.number().min(1) }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ input }) => {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: input.restaurantId, isActive: true },
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
          throw new TRPCError({ code: "BAD_REQUEST", message: `Product unavailable: ${item.productId}` });
        }
        if (product.stockQuantity < item.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: `Insufficient stock for ${product.name}` });
        }

        const unitPrice = product.currentPrice;
        subtotal += unitPrice * item.quantity;
        lineItems.push({
          productId: product.id,
          quantity: item.quantity,
          priceAtPurchase: unitPrice,
          productName: product.name,
        });

        await prisma.product.update({ where: { id: product.id }, data: { stockQuantity: { decrement: item.quantity } } });
      }

      const tax = Math.round(subtotal * restaurant.taxPercent);
      const serviceFee = Math.round(subtotal * restaurant.serviceFeePercent);
      const total = subtotal + tax + serviceFee;

      const orderNumber = await nextOrderNumber(input.restaurantId);

      // attempt create with retry in case orderNumber collision
      let order: any = null;
      let attempts = 0;
      while (!order && attempts < 3) {
        attempts += 1;
        const _orderNumber = attempts === 1 ? orderNumber : await nextOrderNumber(input.restaurantId);
        try {
          order = await prisma.order.create({
            data: {
              restaurantId: input.restaurantId,
              orderNumber: _orderNumber,
              subtotal,
              tax,
              serviceFee,
              totalAmount: total,
              status: "CONFIRMED",
              source: "qr",
              customerName: input.customerName,
              tableNumber: input.tableNumber,
              notes: input.notes,
              orderItems: { create: lineItems.map((li) => ({ productId: li.productId, quantity: li.quantity, priceAtPurchase: li.priceAtPurchase, productName: li.productName })) },
            },
            include: { orderItems: true },
          });
        } catch (err: any) {
          if (err?.code === "P2002") {
            order = null; // retry
          } else {
            throw err;
          }
        }
      }
      if (!order) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create order after retries" });
      }

      emitOrderCreated({
        restaurantId: restaurant.legacyId,
        orderId: order.orderNumber,
        orderNumber: String(order.orderNumber),
        source: "qr",
        total,
        subtotal,
        tax,
        notes: input.notes,
        tableNumber: input.tableNumber,
        customerName: input.customerName,
        items: lineItems.map((li) => ({ productId: li.productId, productName: li.productName, quantity: li.quantity, unitPrice: li.priceAtPurchase, totalPrice: li.priceAtPurchase * li.quantity })),
        createdAt: order.createdAt.toISOString(),
      });

      return { success: true, orderId: order.id, orderNumber: order.orderNumber, total };
    }),
});
