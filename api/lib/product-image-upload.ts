import fs from "node:fs/promises";
import path from "node:path";
import { nanoid } from "nanoid";

export const PRODUCT_UPLOAD_DIR = path.resolve(
  process.cwd(),
  "public",
  "uploads",
  "products",
);

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

export async function ensureProductUploadDir(): Promise<void> {
  await fs.mkdir(PRODUCT_UPLOAD_DIR, { recursive: true });
}

export function slugifyFilenamePart(value: string): string {
  const base = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
  return base.length >= 2 ? base.slice(0, 48) : "product";
}

export function buildProductImageFilename(
  mime: string,
  originalName: string,
  nameHint?: string,
): string {
  const ext = EXT_BY_MIME[mime] ?? ".png";
  const hint =
    nameHint?.trim() ||
    path.basename(originalName, path.extname(originalName));
  const slug = slugifyFilenamePart(hint);
  return `${slug}-${nanoid(6)}${ext}`;
}

export async function saveProductImageFile(
  file: File,
  nameHint?: string,
): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only PNG, JPG, and WebP images are allowed");
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    throw new Error("Image must be 5MB or smaller");
  }

  await ensureProductUploadDir();
  const filename = buildProductImageFilename(file.type, file.name, nameHint);
  const dest = path.join(PRODUCT_UPLOAD_DIR, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(dest, buffer);
  return `/uploads/products/${filename}`;
}
