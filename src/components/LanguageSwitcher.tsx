import React from "react";
import { Globe } from "lucide-react";
import { clsx } from "clsx";
import { LOCALES, LOCALE_LABELS, type Locale } from "../i18n/config";
import { useI18n } from "../providers/I18nProvider";

type LanguageSwitcherProps = {
  variant?: "compact" | "pills" | "select";
  className?: string;
  onLocaleChange?: (locale: Locale) => void;
};

export function LanguageSwitcher({
  variant = "pills",
  className,
  onLocaleChange,
}: LanguageSwitcherProps) {
  const { locale, setLocale, t } = useI18n();

  const pickLocale = (code: Locale) => {
    setLocale(code);
    onLocaleChange?.(code);
  };

  if (variant === "select") {
    return (
      <div className={clsx("space-y-1", className)}>
        <label className="mb-2 block text-sm text-slate-300">
          {t("settings.uiLanguage")}
        </label>
        <select
          value={locale}
          onChange={(e) => pickLocale(e.target.value as Locale)}
          className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 focus:border-emerald-500 focus:outline-none"
        >
          {LOCALES.map((code) => (
            <option key={code} value={code}>
              {LOCALE_LABELS[code]}
            </option>
          ))}
        </select>
        <p className="text-xs text-slate-500">{t("settings.uiLanguageHint")}</p>
      </div>
    );
  }

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      {variant !== "compact" && (
        <Globe className="h-4 w-4 shrink-0 text-slate-500" aria-hidden />
      )}
      <div
        className="flex rounded-lg border border-slate-700/80 bg-slate-950/80 p-0.5"
        role="group"
        aria-label={t("common.language")}
      >
        {LOCALES.map((code) => (
          <button
            key={code}
            type="button"
            onClick={() => pickLocale(code)}
            className={clsx(
              "rounded-md px-2.5 py-1 text-xs font-semibold uppercase tracking-wide transition-all",
              locale === code
                ? "bg-emerald-500 text-emerald-950 shadow-sm"
                : "text-slate-400 hover:text-slate-200",
            )}
          >
            {code}
          </button>
        ))}
      </div>
    </div>
  );
}
