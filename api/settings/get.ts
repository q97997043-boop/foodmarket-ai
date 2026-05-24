import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuthHeader } from "../lib/verify-auth-header";
import { prisma } from "../prisma-client";
import { seedRestaurantDefaults } from "../lib/seed";
import { nextLegacyRestaurantId } from "../lib/ids";

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
    await prisma.user.update({ where: { id: userId }, data: { restaurantId: created.id } });
    id = created.id;
  }

  let restaurant = await prisma.restaurant.findUnique({ where: { id } });
  if (!restaurant) {
    throw new Error("Restaurant not found");
  }

  if (!restaurant.legacyId) {
    await prisma.restaurant.update({ where: { id }, data: { legacyId: await nextLegacyRestaurantId() } });
  }

  await seedRestaurantDefaults(id);
  return prisma.restaurant.findUnique({ where: { id } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", method: req.method });
  }

  try {
    const authHeader = req.headers?.authorization as string | undefined;
    const user = await verifyAuthHeader(authHeader);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const restaurant = await ensureRestaurant(user.id, user.restaurantId);
    const owner = await prisma.user.findUnique({ where: { id: user.id } });

    return res.status(200).json({ success: true, restaurant, owner });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
