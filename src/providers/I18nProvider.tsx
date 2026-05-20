import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  DEFAULT_LOCALE,
  LOCALE_CURRENCIES,
  LOCALE_STORAGE_KEY,
  type Locale,
  readStoredLocale,
} from "../i18n/config";
import { translate } from "../i18n";
import { translateError } from "../i18n/translateError";
import { formatMoney as formatMoneyLib } from "../lib/format";

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  currency: string;
  formatMoney: (amount: number, currencyOverride?: string) => string;
  translateError: (message: string) => string;
  localeLabel: string;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) =>
      translate(locale, key, params),
    [locale],
  );

  const currency = LOCALE_CURRENCIES[locale];

  const formatMoney = useCallback(
    (amount: number, currencyOverride?: string) =>
      formatMoneyLib(amount, currencyOverride ?? currency, locale),
    [currency, locale],
  );

  const translateErr = useCallback(
    (message: string) => translateError(message, locale),
    [locale],
  );

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      currency,
      formatMoney,
      translateError: translateErr,
      localeLabel: locale.toUpperCase(),
    }),
    [locale, setLocale, t, currency, formatMoney, translateErr],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return ctx;
}

export { DEFAULT_LOCALE, LOCALE_STORAGE_KEY };
