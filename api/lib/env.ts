export const env = {
  isProduction: process.env.NODE_ENV === "production",
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./sqlite.db",
  JWT_SECRET: process.env.JWT_SECRET ?? "foodmarket-secret",
};
