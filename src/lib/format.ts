import type { Locale } from "../i18n/config";

const CURRENCY_SYMBOLS: Record<string, string> = {
  UZS: "so'm",
  USD: "$",
  EUR: "€",
  RUB: "₽",
};

const LOCALE_NUMBER: Record<Locale, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function formatMoney(
  amount: number,
  currency = "UZS",
  locale?: Locale,
) {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  const formatted = locale
    ? Math.round(amount).toLocaleString(LOCALE_NUMBER[locale])
    : Math.round(amount).toLocaleString();

  if (currency === "USD" || currency === "EUR" || currency === "RUB") {
    return `${symbol}${formatted}`;
  }
  return `${formatted} ${symbol}`;
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
