const databaseUrl = process.env.DATABASE_URL?.trim();
const isProduction = process.env.NODE_ENV === "production";

if (!databaseUrl) {
  throw new Error(
    "DATABASE_URL environment variable must be set. Remove SQLite fallback and configure PostgreSQL."
  );
}

console.log("[ENV] Using DATABASE_URL from environment");
console.log("[ENV] Configuration:", {
  isProduction,
  databaseUrl: databaseUrl.substring(0, 50) + "...",
});

export const env = {
  isProduction,
  DATABASE_URL: databaseUrl,
  JWT_SECRET: process.env.JWT_SECRET ?? "foodmarket-secret",
};
