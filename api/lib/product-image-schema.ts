import { z } from "zod";

/** Relative public URL e.g. /uploads/products/lavash-abc123.png */
export const productImagePathSchema = z
  .string()
  .max(512)
  .regex(
    /^\/uploads\/products\/[a-z0-9][a-z0-9._-]*\.(png|jpe?g|webp)$/i,
    "Invalid product image path",
  )
  .optional()
  .nullable();

export function normalizeProductImageUrl(
  imageUrl: string | null | undefined,
): string | undefined | null {
  if (imageUrl === undefined) return undefined;
  if (imageUrl === null || imageUrl === "") return null;
  if (imageUrl.startsWith("data:")) {
    throw new Error(
      "Base64 images are not supported. Upload a file instead.",
    );
  }
  return imageUrl;
}
