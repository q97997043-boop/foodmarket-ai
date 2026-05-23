import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useI18n } from "../providers/I18nProvider";
import { registerViaRest } from "../lib/auth-api";
import { logInit } from "../lib/init-log";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { BrandLogo } from "../components/BrandLogo";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, translateError } = useI18n();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    const payload = {
      email: email.trim(),
      password,
      restaurantName: restaurantName.trim() || undefined,
    };

    logInit("register", "submit", { email: payload.email });

    try {
      logInit("register", "REST API request", { email: payload.email });
      const result = await registerViaRest(payload);

      login(result.token, result.user);
      logInit("register", "auto-login, redirecting to dashboard");
      navigate("/", { replace: true });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const message = translateError(errorMsg);
      logInit("register", "failed", message);
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[#020817] p-4 text-white">
      <div className="absolute right-4 top-4">
        <LanguageSwitcher variant="compact" />
      </div>

      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0F172A] p-8 shadow-xl">
        <div className="mb-8 text-center">
          <div className="mb-4 flex justify-center">
            <BrandLogo size="xl" animate />
          </div>
          <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            {t("auth.register.title")}
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-emerald-400/80">
            {t("common.tagline")}
          </p>
          <p className="mt-4 text-slate-400">{t("auth.register.subtitle")}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              {t("auth.register.restaurantName")}
            </label>
            <input
              type="text"
              value={restaurantName}
              onChange={(e) => setRestaurantName(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t("auth.register.restaurantPlaceholder")}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              {t("auth.register.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t("auth.register.emailPlaceholder")}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              {t("auth.register.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              minLength={6}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-cyan-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-cyan-600 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              t("auth.register.submit")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {t("auth.register.hasAccount")}{" "}
          <Link
            to="/login"
            className="font-medium text-cyan-400 hover:text-cyan-300"
          >
            {t("auth.register.loginLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
