/**
 * Resolve product/restaurant image URLs for <img src>.
 * Supports relative upload paths, legacy data URLs, and absolute URLs.
 */
export function resolveImageSrc(
  url: string | null | undefined,
): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("data:") || url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  if (url.startsWith("/")) return url;
  return `/${url.replace(/^\/+/, "")}`;
}
