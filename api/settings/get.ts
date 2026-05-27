import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuthHeader } from "../lib/verifyAuthHeaderUtil.js";
import { prisma } from "../prisma-client";
import { ensureRestaurantForUser } from "../lib/auth-service.js";

async function ensureRestaurant(userId: string, restaurantId: string | null) {
  const restaurant = await ensureRestaurantForUser(userId, restaurantId);
  return restaurant;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");
  console.log("SETTINGS REQUEST", req.method, req.headers?.authorization);

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({
      success: false,
      message: "Method not allowed",
      method: req.method,
    });
  }

  try {
    const authHeader = req.headers?.authorization as string | undefined;
    const user = await verifyAuthHeader(authHeader);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const restaurant = await ensureRestaurant(user.id, user.restaurantId);
    const owner = await prisma.user.findUnique({ where: { id: user.id } });

    return res.status(200).json({
      success: true,
      restaurant,
      owner,
    });
  } catch (err) {
    console.error("SETTINGS ERROR", err);
    return res.status(500).json({
      success: false,
      message: err instanceof Error ? err.message : "Server error",
    });
  }
}
