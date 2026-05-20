import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { TRPCClientError } from "@trpc/client";
import { trpc } from "../lib/trpc";
import { useAuth } from "../providers/AuthProvider";
import { useI18n } from "../providers/I18nProvider";
import { parseFetchError } from "../providers/TRPCProvider";
import { loginViaRest } from "../lib/auth-api";
import { logInit } from "../lib/init-log";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { BrandLogo } from "../components/BrandLogo";
import { readBrandingCache } from "../lib/branding-cache";

export default function Login() {
  const cachedBrand = readBrandingCache();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { login } = useAuth();
  const { t, translateError } = useI18n();
  const loginMutation = trpc.auth.login.useMutation();

  const getErrorMessage = (err: unknown): string => {
    if (err instanceof TRPCClientError) return translateError(err.message);
    return translateError(parseFetchError(err));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const payload = { email: email.trim(), password };

    try {
      let result: { token: string; user: Parameters<typeof login>[1] };

      try {
        result = await loginMutation.mutateAsync(payload);
      } catch (trpcErr) {
        const msg = getErrorMessage(trpcErr);
        const isNetwork =
          trpcErr instanceof TypeError ||
          (trpcErr instanceof TRPCClientError &&
            (msg.includes("fetch") || msg.includes("network") || msg.includes("server")));

        if (!isNetwork) throw trpcErr;
        logInit("login", "REST fallback", msg);
        result = await loginViaRest(payload);
      }

      login(result.token, result.user);
      navigate("/", { replace: true });
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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
            <BrandLogo
              logoUrl={cachedBrand?.logoUrl}
              name={cachedBrand?.name ?? t("common.appName")}
              size="xl"
              accent={cachedBrand?.themeColor}
              animate
            />
          </div>
          <h1 className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-3xl font-bold text-transparent">
            {cachedBrand?.name ?? t("common.appName")}
          </h1>
          <p className="mt-1 text-xs font-medium tracking-wide text-emerald-400/80">
            {t("common.tagline")}
          </p>
          <p className="mt-4 text-slate-400">{t("auth.login.welcome")}</p>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/50 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              {t("auth.login.email")}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder={t("auth.login.emailPlaceholder")}
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              {t("auth.login.password")}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-[#1E293B] px-4 py-3 text-white transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isLoading}
            className="flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-white transition-colors hover:bg-emerald-600 disabled:opacity-50"
          >
            {loginMutation.isLoading ? (
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              t("auth.login.submit")
            )}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          {t("auth.login.noAccount")}{" "}
          <Link
            to="/register"
            className="font-medium text-emerald-400 hover:text-emerald-300"
          >
            {t("auth.login.registerLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
