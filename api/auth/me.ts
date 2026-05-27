import type { VercelRequest, VercelResponse } from "@vercel/node";
import { verifyAuthHeader } from "../lib/verifyAuthHeaderUtil.js";
import { ensureRestaurantForUser } from "../lib/auth-service.js";
import { prisma } from "../prisma-client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed", method: req.method });
  }

  try {
    const authHeader = req.headers?.authorization as string | undefined;
    let user = await verifyAuthHeader(authHeader);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!user.restaurantId) {
      await ensureRestaurantForUser(user.id, user.restaurantId);
      user = await prisma.user.findUnique({
        where: { id: user.id },
      });
    }

    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ error: "Server error", details: String(err) });
  }
}
