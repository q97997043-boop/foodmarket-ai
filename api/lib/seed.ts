import { prisma } from "../prisma-client";

const DEFAULT_CATEGORIES = [
  { name: "Burgers", slug: "burgers", sortOrder: 0 },
  { name: "Pizza", slug: "pizza", sortOrder: 1 },
  { name: "Sides", slug: "sides", sortOrder: 2 },
  { name: "Drinks", slug: "drinks", sortOrder: 3 },
];

const DEMO_PRODUCTS = [
  { name: "Classic Burger", emoji: "🍔", categorySlug: "burgers", basePrice: 45000, stock: 50 },
  { name: "Cheese Pizza", emoji: "🍕", categorySlug: "pizza", basePrice: 65000, stock: 30 },
  { name: "French Fries", emoji: "🍟", categorySlug: "sides", basePrice: 18000, stock: 80 },
  { name: "Coca Cola", emoji: "🥤", categorySlug: "drinks", basePrice: 12000, stock: 100 },
  { name: "Chicken Nuggets", emoji: "🍗", categorySlug: "sides", basePrice: 32000, stock: 40 },
];

export async function seedRestaurantDefaults(restaurantId: string) {
  const existing = await prisma.category.count({ where: { restaurantId } });
  if (existing > 0) return;

  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.create({
      data: { ...cat, restaurantId },
    });
  }

  const categories = await prisma.category.findMany({ where: { restaurantId } });
  const bySlug = Object.fromEntries(categories.map((c) => [c.slug, c.id]));

  for (const [i, p] of DEMO_PRODUCTS.entries()) {
    const price = p.basePrice;
    await prisma.product.create({
      data: {
        name: p.name,
        emoji: p.emoji,
        basePrice: price,
        currentPrice: price,
        minPrice: price * 0.85,
        maxPrice: price * 1.15,
        stockQuantity: p.stock,
        categoryId: bySlug[p.categorySlug],
        restaurantId,
        sortOrder: i,
        isAvailable: true,
      },
    });
  }

  await prisma.tvDisplaySettings.upsert({
    where: { restaurantId },
    create: { restaurantId },
    update: {},
  });
}
