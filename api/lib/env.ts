const databaseUrl = (
  process.env.DATABASE_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_URL_NON_POOLING
)?.trim();
const isProduction = process.env.NODE_ENV === "production";

if (!databaseUrl) {
  console.warn(
    "[ENV WARNING] DATABASE_URL (or fallback Vercel env vars) is not set in this environment."
  );
} else {
  console.log("[ENV] Using DATABASE_URL from environment/fallbacks");
  console.log("[ENV] Configuration:", {
    isProduction,
    databaseUrl: databaseUrl.substring(0, 50) + "...",
  });
}

export const env = {
  isProduction,
  DATABASE_URL: databaseUrl || "",
  JWT_SECRET: process.env.JWT_SECRET ?? "foodmarket-secret",
};
