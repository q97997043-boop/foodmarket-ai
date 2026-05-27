import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./prisma-client";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Content-Type", "application/json");

  try {
    const databaseUrl = String(process.env.DATABASE_URL ?? "").trim();
    let userCount: number | null = null;
    let error: string | null = null;

    try {
      await prisma.$connect();
      userCount = await prisma.user.count();
    } catch (e) {
      error = String(e);
      console.error("DEBUG-DB PRISMA ERROR", e);
    }

    return res.status(200).json({
      success: true,
      databaseUrl,
      userCount,
      error,
    });
  } catch (err) {
    console.error("DEBUG-DB CRASH", err);
    return res.status(500).json({ success: false, error: String(err) });
  }
}
