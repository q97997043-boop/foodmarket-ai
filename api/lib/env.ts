import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const defaultDbPath = pathToFileURL(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../prisma/sqlite.db"),
).href;

export const env = {
  isProduction: process.env.NODE_ENV === "production",
  DATABASE_URL: process.env.DATABASE_URL ?? defaultDbPath,
  JWT_SECRET: process.env.JWT_SECRET ?? "foodmarket-secret",
};
