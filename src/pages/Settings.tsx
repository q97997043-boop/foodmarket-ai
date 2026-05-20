import React, { useEffect, useState } from "react";
import { Save, Loader2, Phone, Palette } from "lucide-react";
import { trpc } from "../lib/trpc";
import { ImageUpload } from "../components/ImageUpload";
import { SettingsSection } from "../components/SettingsSection";
import { useRestaurant } from "../providers/RestaurantProvider";
import { useI18n } from "../providers/I18nProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import type { Locale } from "../i18n/config";

const inputClass =
  "w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 transition focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50";

export default function Settings() {
  const { restaurant, owner, restaurantId, refetch } = useRestaurant();
  const { t, setLocale, locale } = useI18n();
  const updateRestaurant = trpc.settings.update.useMutation();
  const updateOwner = trpc.settings.updateOwner.useMutation();

  const qrUrl =
    typeof window !== "undefined" && restaurant?.slug
      ? `${window.location.origin}/m/${restaurant.slug}`
      : "";

  const [restaurantForm, setRestaurantForm] = useState({
    name: "",
    logoUrl: null as string | null,
    bannerUrl: null as string | null,
    bio: "",
    address: "",
    phone: "",
    telegramUrl: "",
    instagramUrl: "",
    currency: "UZS" as "UZS" | "USD" | "EUR" | "RUB",
    themeColor: "#10b981",
    language: "uz" as Locale,
    taxPercent: 12,
    serviceFeePercent: 0,
    realtimeEnabled: true,
  });

  const [ownerForm, setOwnerForm] = useState({
    fullName: "",
    avatarUrl: null as string | null,
    bio: "",
    phone: "",
    telegram: "",
    address: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!restaurant) return;
    setRestaurantForm({
      name: restaurant.name,
      logoUrl: restaurant.logoUrl,
      bannerUrl: restaurant.bannerUrl,
      bio: restaurant.bio ?? "",
      address: restaurant.address ?? "",
      phone: restaurant.phone ?? "",
      telegramUrl: restaurant.telegramUrl ?? "",
      instagramUrl: restaurant.instagramUrl ?? "",
      currency: restaurant.currency as typeof restaurantForm.currency,
      themeColor: restaurant.themeColor,
      language: (restaurant.language as Locale) || "uz",
      taxPercent: Math.round((restaurant.taxPercent ?? 0.12) * 100),
      serviceFeePercent: Math.round((restaurant.serviceFeePercent ?? 0) * 100),
      realtimeEnabled: restaurant.realtimeEnabled ?? true,
    });
  }, [restaurant]);

  useEffect(() => {
    if (!owner) return;
    setOwnerForm({
      fullName: owner.fullName ?? "",
      avatarUrl: owner.avatarUrl,
      bio: owner.bio ?? "",
      phone: owner.phone ?? "",
      telegram: owner.telegram ?? "",
      address: owner.address ?? "",
    });
  }, [owner]);

  useEffect(() => {
    setRestaurantForm((f) => ({ ...f, language: locale }));
  }, [locale]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restaurantId) return;

    await updateRestaurant.mutateAsync({
      name: restaurantForm.name,
      logoUrl: restaurantForm.logoUrl,
      bannerUrl: restaurantForm.bannerUrl,
      bio: restaurantForm.bio || null,
      address: restaurantForm.address || null,
      phone: restaurantForm.phone || null,
      telegramUrl: restaurantForm.telegramUrl || null,
      instagramUrl: restaurantForm.instagramUrl || null,
      currency: restaurantForm.currency,
      themeColor: restaurantForm.themeColor,
      language: locale,
      taxPercent: restaurantForm.taxPercent / 100,
      serviceFeePercent: restaurantForm.serviceFeePercent / 100,
      realtimeEnabled: restaurantForm.realtimeEnabled,
    });

    await updateOwner.mutateAsync({
      fullName: ownerForm.fullName || null,
      avatarUrl: ownerForm.avatarUrl,
      bio: ownerForm.bio || null,
      phone: ownerForm.phone || null,
      telegram: ownerForm.telegram || null,
      address: ownerForm.address || null,
    });

    await refetch();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const saving = updateRestaurant.isLoading || updateOwner.isLoading;

  return (
    <div className="cyber-grid-bg flex-1 overflow-y-auto bg-slate-950 p-6 text-slate-50 md:p-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="cyber-text-glow text-3xl font-bold text-white">{t("settings.title")}</h1>
          <p className="mt-1 text-slate-400">{t("settings.subtitle")}</p>
        </div>
        <LanguageSwitcher variant="pills" />
      </header>

      {qrUrl && (
        <div className="mx-auto mb-6 max-w-4xl rounded-xl border border-cyan-500/20 bg-cyan-500/5 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wider text-cyan-400">
            {t("market.qrMenu")}
          </p>
          <a
            href={qrUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-1 block break-all font-mono text-sm text-emerald-400 hover:underline"
          >
            {qrUrl}
          </a>
        </div>
      )}

      <form onSubmit={handleSave} className="mx-auto max-w-4xl space-y-6">
        <SettingsSection
          title={t("settings.branding")}
          description={t("settings.brandingDesc")}
          accent="emerald"
        >
          <div className="grid gap-8 lg:grid-cols-2">
            <ImageUpload
              label={t("settings.logo")}
              hint={t("settings.logoHint")}
              value={restaurantForm.logoUrl}
              onChange={(logoUrl) => setRestaurantForm((f) => ({ ...f, logoUrl }))}
            />
            <ImageUpload
              label={t("settings.ownerAvatar")}
              hint={t("settings.avatarHint")}
              aspect="avatar"
              value={ownerForm.avatarUrl}
              onChange={(avatarUrl) => setOwnerForm((f) => ({ ...f, avatarUrl }))}
            />
          </div>
          <div className="mt-6">
            <ImageUpload
              label={t("settings.banner")}
              hint={t("settings.bannerHint")}
              aspect="banner"
              value={restaurantForm.bannerUrl}
              onChange={(bannerUrl) => setRestaurantForm((f) => ({ ...f, bannerUrl }))}
            />
          </div>
          <div className="mt-6">
            <label className="mb-2 block text-sm text-slate-300">{t("settings.restaurantName")}</label>
            <input
              value={restaurantForm.name}
              onChange={(e) => setRestaurantForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.restaurantProfile")}
          description={t("settings.restaurantProfileDesc")}
          accent="cyan"
        >
          <label className="mb-2 block text-sm text-slate-300">{t("settings.restaurantBio")}</label>
          <textarea
            value={restaurantForm.bio}
            onChange={(e) => setRestaurantForm((f) => ({ ...f, bio: e.target.value }))}
            rows={4}
            className={inputClass}
            placeholder={t("settings.bioPlaceholder")}
          />
        </SettingsSection>

        <SettingsSection
          title={t("settings.ownerProfile")}
          description={t("settings.ownerProfileDesc")}
          accent="fuchsia"
        >
          <div className="mb-6 flex items-center gap-4 rounded-xl border border-slate-800 bg-slate-950/50 p-4">
            <ImageUpload
              label=""
              aspect="avatar"
              value={ownerForm.avatarUrl}
              onChange={(avatarUrl) => setOwnerForm((f) => ({ ...f, avatarUrl }))}
              className="!space-y-0"
            />
            <div>
              <p className="font-semibold text-white">{ownerForm.fullName || owner?.email}</p>
              <p className="text-sm text-slate-400">{owner?.email}</p>
              <p className="mt-1 inline-block rounded-full bg-fuchsia-500/10 px-2 py-0.5 text-xs font-medium text-fuchsia-400">
                {owner?.role ?? "OWNER"}
              </p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.fullName")}</label>
              <input
                value={ownerForm.fullName}
                onChange={(e) => setOwnerForm((f) => ({ ...f, fullName: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.ownerBio")}</label>
              <input
                value={ownerForm.bio}
                onChange={(e) => setOwnerForm((f) => ({ ...f, bio: e.target.value }))}
                className={inputClass}
                placeholder={t("settings.ownerBioPlaceholder")}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.contact")}
          description={t("settings.contactDesc")}
          accent="amber"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 flex items-center gap-2 text-sm text-slate-300">
                <Phone className="h-4 w-4" />
                {t("settings.restaurantPhone")}
              </label>
              <input
                value={restaurantForm.phone}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.ownerPhone")}</label>
              <input
                value={ownerForm.phone}
                onChange={(e) => setOwnerForm((f) => ({ ...f, phone: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">{t("settings.address")}</label>
              <input
                value={restaurantForm.address}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, address: e.target.value }))}
                className={inputClass}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.social")}
          description={t("settings.socialDesc")}
          accent="violet"
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.telegram")}</label>
              <input
                value={restaurantForm.telegramUrl}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, telegramUrl: e.target.value }))}
                placeholder={t("settings.telegramPlaceholder")}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.telegramUsername")}</label>
              <input
                value={ownerForm.telegram}
                onChange={(e) => setOwnerForm((f) => ({ ...f, telegram: e.target.value }))}
                placeholder="@username"
                className={inputClass}
              />
            </div>
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">{t("settings.instagram")}</label>
              <input
                value={restaurantForm.instagramUrl}
                onChange={(e) => setRestaurantForm((f) => ({ ...f, instagramUrl: e.target.value }))}
                placeholder={t("settings.instagramPlaceholder")}
                className={inputClass}
              />
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title={t("settings.preferences")}
          description={t("settings.preferencesDesc")}
          accent="emerald"
        >
          <div className="mb-6 flex items-center gap-2 text-slate-400">
            <Palette className="h-4 w-4" />
            <span className="text-sm">{t("settings.themeSection")}</span>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.currency")}</label>
              <select
                value={restaurantForm.currency}
                onChange={(e) =>
                  setRestaurantForm((f) => ({
                    ...f,
                    currency: e.target.value as typeof f.currency,
                  }))
                }
                className={inputClass}
              >
                <option value="UZS">{t("settings.currencyUz")}</option>
                <option value="USD">{t("settings.currencyUsd")}</option>
                <option value="EUR">{t("settings.currencyEur")}</option>
                <option value="RUB">{t("settings.currencyRub")}</option>
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.themeColor")}</label>
              <input
                type="color"
                value={restaurantForm.themeColor}
                onChange={(e) =>
                  setRestaurantForm((f) => ({ ...f, themeColor: e.target.value }))
                }
                className="h-12 w-full cursor-pointer rounded-xl border border-slate-700 bg-slate-950"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.uiLanguage")}</label>
              <select
                value={restaurantForm.language}
                onChange={(e) => {
                  const lang = e.target.value as Locale;
                  setRestaurantForm((f) => ({ ...f, language: lang }));
                  setLocale(lang);
                }}
                className={inputClass}
              >
                <option value="uz">Oʻzbekcha</option>
                <option value="ru">Русский</option>
                <option value="en">English</option>
              </select>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.taxPercent")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={restaurantForm.taxPercent}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(e) =>
                    setRestaurantForm((f) => ({
                      ...f,
                      taxPercent: Number(e.target.value || 0),
                    }))
                  }
                  className={inputClass}
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm text-slate-300">{t("settings.serviceFeePercent")}</label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={restaurantForm.serviceFeePercent}
                  min={0}
                  max={100}
                  step={0.5}
                  onChange={(e) =>
                    setRestaurantForm((f) => ({
                      ...f,
                      serviceFeePercent: Number(e.target.value || 0),
                    }))
                  }
                  className={inputClass}
                />
                <span className="text-sm text-slate-400">%</span>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-3xl border border-slate-700 bg-slate-950 px-4 py-4">
              <input
                id="realtime-enabled"
                type="checkbox"
                checked={restaurantForm.realtimeEnabled}
                onChange={(e) =>
                  setRestaurantForm((f) => ({
                    ...f,
                    realtimeEnabled: e.target.checked,
                  }))
                }
                className="h-5 w-5 rounded border-slate-600 bg-slate-900 text-emerald-500"
              />
              <label htmlFor="realtime-enabled" className="text-sm text-slate-200">
                {t("settings.realtimeEnabled")}
              </label>
            </div>
          </div>
        </SettingsSection>

        <button
          type="submit"
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-bold text-emerald-950 shadow-[0_0_32px_rgba(16,185,129,0.25)] transition hover:bg-emerald-400 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Save className="h-5 w-5" />
          )}
          {saved ? t("settings.saved") : t("settings.saveSettings")}
        </button>
      </form>
    </div>
  );
}
