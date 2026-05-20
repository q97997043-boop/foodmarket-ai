import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { prisma } from "./prisma-client";
import { requireRestaurantId } from "./lib/access";
import { seedRestaurantDefaults } from "./lib/seed";
import { nextLegacyRestaurantId } from "./lib/ids";

const imageSchema = z
  .string()
  .max(2_500_000)
  .optional()
  .nullable();

const restaurantUpdateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  logoUrl: imageSchema,
  bannerUrl: imageSchema,
  bio: z.string().max(2000).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  telegramUrl: z.string().max(200).optional().nullable(),
  instagramUrl: z.string().max(200).optional().nullable(),
  currency: z.enum(["UZS", "USD", "EUR", "RUB"]).optional(),
  themeColor: z.string().max(20).optional(),
  language: z.enum(["en", "uz", "ru"]).optional(),
  taxPercent: z.number().min(0).max(100).optional(),
  serviceFeePercent: z.number().min(0).max(100).optional(),
  realtimeEnabled: z.boolean().optional(),
});

const ownerUpdateSchema = z.object({
  fullName: z.string().max(120).optional().nullable(),
  avatarUrl: imageSchema,
  bio: z.string().max(1000).optional().nullable(),
  phone: z.string().max(40).optional().nullable(),
  telegram: z.string().max(80).optional().nullable(),
  address: z.string().max(300).optional().nullable(),
});

async function ensureRestaurant(userId: string, restaurantId: string | null) {
  let id = restaurantId;

  if (!id) {
    const legacyId = await nextLegacyRestaurantId();
    const slug = `restaurant-${legacyId}`;
    const created = await prisma.restaurant.create({
      data: {
        name: "FoodMarket AI",
        slug,
        legacyId,
        tvSettings: { create: {} },
      },
    });
    await seedRestaurantDefaults(created.id);
    await prisma.user.update({
      where: { id: userId },
      data: { restaurantId: created.id },
    });
    id = created.id;
  }

  let restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Restaurant not found" });
  }

  if (!restaurant.legacyId) {
    await prisma.restaurant.update({
      where: { id },
      data: { legacyId: await nextLegacyRestaurantId() },
    });
  }

  await seedRestaurantDefaults(id);
  return prisma.restaurant.findUnique({ where: { id } });
}

export const settingsRouter = createRouter({
  get: authedQuery.query(async ({ ctx }) => {
    const restaurant = await ensureRestaurant(ctx.user.id, ctx.user.restaurantId);
    const owner = await prisma.user.findUnique({
      where: { id: ctx.user.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        avatarUrl: true,
        bio: true,
        phone: true,
        telegram: true,
        address: true,
      },
    });

    return { restaurant: restaurant!, owner: owner! };
  }),

  update: authedQuery
    .input(restaurantUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      const restaurantId = requireRestaurantId(ctx.user);
      return prisma.restaurant.update({
        where: { id: restaurantId },
        data: input,
      });
    }),

  updateOwner: authedQuery
    .input(ownerUpdateSchema)
    .mutation(async ({ ctx, input }) => {
      return prisma.user.update({
        where: { id: ctx.user.id },
        data: input,
        select: {
          id: true,
          email: true,
          role: true,
          fullName: true,
          avatarUrl: true,
          bio: true,
          phone: true,
          telegram: true,
          address: true,
        },
      });
    }),
});
