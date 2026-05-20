import { nanoid } from "nanoid";

/** Build a URL-safe slug; falls back to random id for non-Latin names. */
export function buildCategorySlug(name: string, explicit?: string): string {
  const base = (explicit ?? name)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

  if (base.length >= 2) return base;
  return `cat-${nanoid(8)}`;
}

export async function uniqueCategorySlug(
  restaurantId: string,
  preferred: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  let slug = preferred;
  if (await exists(slug)) {
    slug = `${preferred}-${nanoid(4)}`;
  }
  return slug;
}
