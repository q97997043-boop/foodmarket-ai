import type { Locale } from "./config";
import uz from "./locales/uz.json";
import ru from "./locales/ru.json";
import en from "./locales/en.json";

export type TranslationDict = typeof uz;

const catalogs: Record<Locale, TranslationDict> = { uz, ru, en };

export function getCatalog(locale: Locale): TranslationDict {
  return catalogs[locale] ?? catalogs.uz;
}

export function resolveKey(dict: TranslationDict, key: string): string | undefined {
  const parts = key.split(".");
  let node: unknown = dict;
  for (const part of parts) {
    if (node === null || node === undefined || typeof node !== "object") {
      return undefined;
    }
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string" ? node : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>,
): string {
  const raw =
    resolveKey(getCatalog(locale), key) ??
    resolveKey(getCatalog("en"), key) ??
    key;

  if (!params) return raw;
  return raw.replace(/\{\{(\w+)\}\}/g, (_, name: string) =>
    String(params[name] ?? ""),
  );
}
