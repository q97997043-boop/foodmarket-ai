import React, { useState, useEffect } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  Settings,
  PackageOpen,
  LogOut,
  LineChart,
  Tv,
  Monitor,
  QrCode,
  Menu,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { useAuth } from "../providers/AuthProvider";
import { useRestaurant } from "../providers/RestaurantProvider";
import { useI18n } from "../providers/I18nProvider";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { BrandLogo } from "../components/BrandLogo";

export function MainLayout() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { user, logout } = useAuth();
  const { restaurant } = useRestaurant();
  const { t } = useI18n();
  const accent = restaurant?.themeColor ?? "#10b981";

  const navItems = [
    { nameKey: "nav.dashboard", path: "/", icon: LayoutDashboard },
    { nameKey: "nav.market", path: "/market", icon: LineChart },
    { nameKey: "nav.pos", path: "/pos", icon: ShoppingCart },
    { nameKey: "nav.kitchen", path: "/kitchen", icon: ChefHat },
    { nameKey: "nav.products", path: "/admin/inventory", icon: PackageOpen },
    { nameKey: "nav.tv", path: "/tv", icon: Tv },
    { nameKey: "nav.display", path: "/display", icon: Monitor },
    {
      nameKey: "nav.qr",
      path: restaurant?.slug ? `/m/${restaurant.slug}` : "/admin/settings",
      icon: QrCode,
    },
    { nameKey: "nav.settings", path: "/admin/settings", icon: Settings },
  ];

  useEffect(() => {
    if (isDrawerOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isDrawerOpen]);

  const renderNavLink = (item: typeof navItems[number]) => {
    const Icon = item.icon;
    const navClasses = ({ isActive }: { isActive: boolean }) =>
      clsx(
        "flex items-center gap-3 rounded-xl px-4 py-3 transition-all",
        isActive
          ? "bg-emerald-500/10 text-emerald-400 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.2)]"
          : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200",
      );

    return (
      <NavLink
        key={item.nameKey}
        to={item.path}
        end={item.path === "/"}
        className={navClasses}
        onClick={() => setIsDrawerOpen(false)}
      >
        <Icon className="h-5 w-5" />
        <span className="font-medium">{t(item.nameKey)}</span>
      </NavLink>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950 text-slate-50">
      <div className="flex flex-1 flex-col overflow-hidden md:flex-row">
        <header className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-3 md:hidden">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400"
            >
              <Menu className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-emerald-400">{t("common.appName")}</span>
          </div>
          <LanguageSwitcher variant="compact" />
        </header>

        <aside className="hidden w-64 min-h-0 flex-col border-r border-slate-800 bg-slate-900 md:flex">
          <div className="border-b border-slate-800 p-6">
            <div className="flex items-center gap-3">
              <BrandLogo
                logoUrl={restaurant?.logoUrl}
                name={restaurant?.name}
                size="md"
                accent={accent}
              />
              <div>
                <h1 className="text-lg font-bold leading-tight text-white">
                  {restaurant?.name ?? t("common.appName")}
                </h1>
                <p className="text-[10px] font-medium tracking-wide text-emerald-400/80">
                  {t("common.appName")}
                </p>
              </div>
            </div>
          </div>

          <nav className="flex-1 min-h-0 overflow-y-auto space-y-1 p-4">
            {navItems.map(renderNavLink)}
          </nav>

          <div className="flex flex-col gap-3 border-t border-slate-800 p-4">
            <LanguageSwitcher variant="pills" className="justify-center" />
            <p className="truncate text-sm text-slate-400">
              <span className="text-slate-200">{user?.email}</span>
            </p>
            <button
              onClick={logout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition hover:bg-red-500/10 hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
              {t("nav.logout")}
            </button>
          </div>
        </aside>

        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
          <Outlet />
        </div>
      </div>

      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div
            className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setIsDrawerOpen(false)}
          />
          <div className="relative flex w-72 flex-col border-r border-slate-800 bg-slate-900 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 p-4">
              <span className="text-sm font-semibold text-white">{t("common.menu")}</span>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-200 transition hover:border-emerald-500 hover:text-emerald-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 overflow-y-auto p-4 space-y-1">
              {navItems.map(renderNavLink)}
            </nav>
            <div className="border-t border-slate-800 p-4">
              <LanguageSwitcher variant="pills" className="justify-center" />
              <p className="mt-3 text-sm text-slate-400">{user?.email}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
