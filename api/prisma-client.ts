import { PrismaClient } from "@prisma/client";

const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING
)?.trim();

if (!databaseUrl) {
  console.warn(
    "[PRISMA CLIENT WARNING] DATABASE_URL (or Vercel PostgreSQL integration fallbacks) is not set in this environment."
  );
} else {
  process.env.DATABASE_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "info", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
