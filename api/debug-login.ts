import type { VercelRequest, VercelResponse } from "@vercel/node";
import { prisma } from "./prisma-client";
import { env } from "./lib/env";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse,
) {
  res.setHeader("Content-Type", "application/json");

  const results: Record<string, any> = {
    timestamp: new Date().toISOString(),
    env: {
      NODE_ENV: process.env.NODE_ENV,
      VERCEL: process.env.VERCEL,
      VERCEL_ENV: process.env.VERCEL_ENV,
    },
    database: {
      status: "unknown",
      provider: "postgresql",
      hasUrl: false,
      urlMeta: null,
      error: null,
    },
    prisma: {
      status: "unknown",
      userCount: null,
      error: null,
    },
    jwt: {
      status: "unknown",
      secretLength: 0,
      testSignSuccessful: false,
      error: null,
    },
    bcrypt: {
      status: "unknown",
      hashSuccessful: false,
      compareSuccessful: false,
      error: null,
    },
  };

  // 1. Verify Database URL
  try {
    const rawUrl = (
      process.env.DATABASE_URL ||
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      process.env.POSTGRES_URL_NON_POOLING
    )?.trim();

    if (rawUrl) {
      results.database.hasUrl = true;
      // Mask credentials for safety
      try {
        const parsed = new URL(rawUrl.replace("postgresql://", "http://"));
        results.database.urlMeta = {
          protocol: "postgresql",
          host: parsed.host,
          port: parsed.port,
          pathname: parsed.pathname,
          search: parsed.search,
        };
      } catch (e) {
        results.database.urlMeta = {
          rawLength: rawUrl.length,
          start: rawUrl.substring(0, 15) + "...",
        };
      }
      results.database.status = "configured";
    } else {
      results.database.status = "missing";
    }
  } catch (err: any) {
    results.database.status = "error";
    results.database.error = String(err);
  }

  // 2. Verify Prisma connection & query
  try {
    await prisma.$connect();
    const count = await prisma.user.count();
    results.prisma.status = "connected";
    results.prisma.userCount = count;
  } catch (err: any) {
    results.prisma.status = "failed";
    results.prisma.error = {
      message: err.message || String(err),
      code: err.code,
      meta: err.meta,
      stack: err.stack,
    };
  }

  // 3. Verify JWT
  try {
    const secret = env.JWT_SECRET;
    if (secret) {
      results.jwt.secretLength = secret.length;
      results.jwt.status = "configured";
      const token = jwt.sign({ test: true }, secret, { expiresIn: "1m" });
      const decoded = jwt.verify(token, secret) as any;
      if (decoded && decoded.test === true) {
        results.jwt.testSignSuccessful = true;
      }
    } else {
      results.jwt.status = "missing";
    }
  } catch (err: any) {
    results.jwt.status = "error";
    results.jwt.error = String(err);
  }

  // 4. Verify Bcrypt
  try {
    const testPassword = "debug-test-password-123";
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(testPassword, salt);
    results.bcrypt.hashSuccessful = !!hash;
    
    const isMatch = await bcrypt.compare(testPassword, hash);
    results.bcrypt.compareSuccessful = isMatch;
    results.bcrypt.status = "functional";
  } catch (err: any) {
    results.bcrypt.status = "failed";
    results.bcrypt.error = String(err);
  }

  const statusCode = results.prisma.status === "connected" ? 200 : 500;
  return res.status(statusCode).json(results);
}
