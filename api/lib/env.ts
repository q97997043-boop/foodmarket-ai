const defaultDbPath = "file:./api/prisma/sqlite.db";

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  DATABASE_URL: process.env.DATABASE_URL ?? defaultDbPath,
  JWT_SECRET: process.env.JWT_SECRET ?? "foodmarket-secret",
};
