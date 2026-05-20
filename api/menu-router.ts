import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createRouter, authedQuery } from "./middleware";
import { prisma } from "./prisma-client";
import { assertRestaurantAccess, requireRestaurantId } from "./lib/access";
import { buildCategorySlug, uniqueCategorySlug } from "./lib/category-slug";
import {
  normalizeProductImageUrl,
  productImagePathSchema,
} from "./lib/product-image-schema";

async function assertCategoryBelongsToRestaurant(
  categoryId: string,
  restaurantId: string,
): Promise<void> {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, restaurantId },
  });
  if (!category) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Category not found for this restaurant",
    });
  }
}

export const menuRouter = createRouter({
  getCategories: authedQuery
    .input(z.object({ restaurantId: z.string() }))
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);
      return prisma.category.findMany({
        where: { restaurantId: input.restaurantId },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { products: true } } },
      });
    }),

  createCategory: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        name: z.string().min(1).max(120),
        slug: z.string().min(1).optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);
      const preferred = buildCategorySlug(input.name, input.slug);
      const slug = await uniqueCategorySlug(
        input.restaurantId,
        preferred,
        async (s) => {
          const hit = await prisma.category.findUnique({
            where: {
              restaurantId_slug: {
                restaurantId: input.restaurantId,
                slug: s,
              },
            },
          });
          return Boolean(hit);
        },
      );

      return prisma.category.create({
        data: {
          name: input.name.trim(),
          slug,
          restaurantId: input.restaurantId,
        },
      });
    }),

  updateCategory: authedQuery
    .input(
      z.object({
        id: z.string(),
        restaurantId: z.string(),
        name: z.string().min(1).max(120).optional(),
        slug: z.string().min(1).optional(),
        sortOrder: z.number().int().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const existing = await prisma.category.findFirst({
        where: { id: input.id, restaurantId: input.restaurantId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }

      let slug = input.slug;
      if (input.name && !input.slug) {
        slug = buildCategorySlug(input.name);
      }

      if (slug && slug !== existing.slug) {
        slug = await uniqueCategorySlug(
          input.restaurantId,
          slug,
          async (s) => {
            if (s === existing.slug) return false;
            const hit = await prisma.category.findUnique({
              where: {
                restaurantId_slug: {
                  restaurantId: input.restaurantId,
                  slug: s,
                },
              },
            });
            return Boolean(hit);
          },
        );
      }

      return prisma.category.update({
        where: { id: input.id },
        data: {
          ...(input.name ? { name: input.name.trim() } : {}),
          ...(slug ? { slug } : {}),
          ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
        },
      });
    }),

  deleteCategory: authedQuery
    .input(z.object({ id: z.string(), restaurantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);
      const existing = await prisma.category.findFirst({
        where: { id: input.id, restaurantId: input.restaurantId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Category not found" });
      }
      await prisma.category.delete({ where: { id: input.id } });
      return { success: true };
    }),

  getProducts: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        availableOnly: z.boolean().optional(),
        categoryId: z.string().optional(),
        search: z.string().optional(),
      }),
    )
    .query(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      return prisma.product.findMany({
        where: {
          restaurantId: input.restaurantId,
          ...(input.availableOnly ? { isAvailable: true } : {}),
          ...(input.categoryId ? { categoryId: input.categoryId } : {}),
          ...(input.search
            ? { name: { contains: input.search } }
            : {}),
        },
        include: { category: true },
        orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      });
    }),

  createProduct: authedQuery
    .input(
      z.object({
        restaurantId: z.string(),
        name: z.string().min(1),
        description: z.string().optional(),
        emoji: z.string().optional(),
        imageUrl: productImagePathSchema,
        basePrice: z.number().positive(),
        categoryId: z.string().optional().nullable(),
        stockQuantity: z.number().int().min(0).default(0),
        isAvailable: z.boolean().default(true),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);
      if (input.categoryId) {
        await assertCategoryBelongsToRestaurant(
          input.categoryId,
          input.restaurantId,
        );
      }

      let imageUrl: string | null | undefined;
      try {
        imageUrl = normalizeProductImageUrl(input.imageUrl);
      } catch (err) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message:
            err instanceof Error ? err.message : "Invalid product image",
        });
      }
      const price = input.basePrice;

      return prisma.product.create({
        data: {
          name: input.name.trim(),
          description: input.description?.trim() || undefined,
          emoji: input.emoji,
          imageUrl: imageUrl ?? undefined,
          basePrice: price,
          currentPrice: price,
          minPrice: price * 0.85,
          maxPrice: price * 1.15,
          categoryId: input.categoryId ?? undefined,
          stockQuantity: input.stockQuantity,
          isAvailable: input.isAvailable,
          restaurantId: input.restaurantId,
        },
        include: { category: true },
      });
    }),

  updateProduct: authedQuery
    .input(
      z.object({
        id: z.string(),
        restaurantId: z.string(),
        name: z.string().min(1).optional(),
        description: z.string().optional().nullable(),
        emoji: z.string().optional().nullable(),
        imageUrl: productImagePathSchema,
        basePrice: z.number().positive().optional(),
        categoryId: z.string().optional().nullable(),
        stockQuantity: z.number().int().min(0).optional(),
        isAvailable: z.boolean().optional(),
        aiEnabled: z.boolean().optional(),
      }),
    )
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);

      const existing = await prisma.product.findFirst({
        where: { id: input.id, restaurantId: input.restaurantId },
      });
      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
      }

      if (input.categoryId) {
        await assertCategoryBelongsToRestaurant(
          input.categoryId,
          input.restaurantId,
        );
      }

      const { id, restaurantId, ...updates } = input;
      const data: Record<string, unknown> = { ...updates };

      if (updates.imageUrl !== undefined) {
        try {
          data.imageUrl = normalizeProductImageUrl(updates.imageUrl);
        } catch (err) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              err instanceof Error ? err.message : "Invalid product image",
          });
        }
      }

      if (updates.name) {
        data.name = updates.name.trim();
      }
      if (updates.description !== undefined) {
        data.description = updates.description?.trim() || null;
      }
      if (updates.basePrice !== undefined) {
        data.currentPrice = updates.basePrice;
        data.minPrice = updates.basePrice * 0.85;
        data.maxPrice = updates.basePrice * 1.15;
      }

      return prisma.product.update({
        where: { id },
        data,
        include: { category: true },
      });
    }),

  deleteProduct: authedQuery
    .input(z.object({ id: z.string(), restaurantId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      assertRestaurantAccess(input.restaurantId, ctx.user);
      await prisma.product.deleteMany({
        where: { id: input.id, restaurantId: input.restaurantId },
      });
      return { success: true };
    }),

  myRestaurantId: authedQuery.query(({ ctx }) => {
    return { restaurantId: requireRestaurantId(ctx.user) };
  }),
});
