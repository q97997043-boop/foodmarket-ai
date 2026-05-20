export const LOCALES = ["uz", "ru", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = "uz";
export const LOCALE_STORAGE_KEY = "foodmarket-locale";

/** Display currency per UI language */
export const LOCALE_CURRENCIES: Record<Locale, "UZS" | "RUB" | "USD"> = {
  uz: "UZS",
  ru: "RUB",
  en: "USD",
};

export const LOCALE_LABELS: Record<Locale, string> = {
  uz: "Oʻzbekcha",
  ru: "Русский",
  en: "English",
};

export function isLocale(value: string): value is Locale {
  return LOCALES.includes(value as Locale);
}

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored && isLocale(stored)) return stored;
  } catch {
    // ignore
  }
  return DEFAULT_LOCALE;
}
