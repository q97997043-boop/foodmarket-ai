import { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import jwt from "jsonwebtoken";
import { env } from "./lib/env";
import { prisma } from "./prisma-client";

export async function createContext(opts?: FetchCreateContextFnOptions) {
  let user = null;

  if (opts?.req.headers.has("authorization")) {
    const authHeader = opts.req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET) as {
          id: string;
        };
        const dbUser = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            email: true,
            role: true,
            restaurantId: true,
            fullName: true,
            avatarUrl: true,
            bio: true,
            phone: true,
            telegram: true,
            address: true,
          },
        });
        if (dbUser) {
          user = dbUser;
        }
      } catch {
        // invalid token
      }
    }
  }

  return { user };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
