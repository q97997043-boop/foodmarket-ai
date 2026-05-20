const BRANDING_KEY = "foodmarket-branding";

export type CachedBranding = {
  logoUrl: string | null;
  name: string;
  themeColor?: string;
};

export function saveBrandingCache(data: CachedBranding) {
  try {
    const cleanName = (data.name || "").replace(/test\s*restaurant|demo\s*restaurant|test\s*resto/i, "FoodMarket AI");
    localStorage.setItem(BRANDING_KEY, JSON.stringify({ ...data, name: cleanName }));
  } catch {
    // ignore quota errors
  }
}

export function readBrandingCache(): CachedBranding | null {
  try {
    const raw = localStorage.getItem(BRANDING_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedBranding;
  } catch {
    return null;
  }
}

export function clearBrandingCache() {
  try {
    localStorage.removeItem(BRANDING_KEY);
  } catch {
    // ignore
  }
}
