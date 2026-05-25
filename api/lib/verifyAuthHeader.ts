import jwt from "jsonwebtoken";
import { env } from "./env";
import { prisma } from "../prisma-client";

export async function verifyAuthHeader(authHeader: string | undefined) {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string };
    return prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, restaurantId: true },
    });
  } catch {
    return null;
  }
}
