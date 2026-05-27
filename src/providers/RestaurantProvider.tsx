import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useAuth } from "./AuthProvider";
import { logInit, warnInit } from "../lib/init-log";
import { useLoadingTimeout } from "../hooks/useLoadingTimeout";
import { saveBrandingCache } from "../lib/branding-cache";

export type RestaurantSettings = {
  id: string;
  legacyId: number;
  name: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  bio: string | null;
  address: string | null;
  phone: string | null;
  telegramUrl: string | null;
  instagramUrl: string | null;
  currency: string;
  themeColor: string;
  language: string;
  taxPercent: number;
  serviceFeePercent: number;
  realtimeEnabled: boolean;
};

export type OwnerProfile = {
  id: string;
  email: string;
  role: string;
  fullName: string | null;
  avatarUrl: string | null;
  bio: string | null;
  phone: string | null;
  telegram: string | null;
  address: string | null;
};

type RestaurantContextValue = {
  restaurant: RestaurantSettings | null;
  owner: OwnerProfile | null;
  restaurantId: string | null;
  legacyId: number;
  isLoading: boolean;
  isWorkspaceLoading: boolean;
  settingsError: string | null;
  refetch: () => void;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { user, token, isAuthReady } = useAuth();

  const shouldFetchSettings = Boolean(token && user && isAuthReady);

  const [data, setData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<any | null>(null);

  const refetch = async () => {
    if (!shouldFetchSettings) return;
    setIsLoading(true);
    setIsError(false);
    setError(null);
    try {
      console.log("RestaurantProvider: starting settings fetch", { token, user });
      const res = await fetch(`${window.location.origin}/api/settings/get`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Settings fetch failed: ${res.status} ${txt}`);
      }
      const contentType = res.headers.get("content-type") || "";
      if (!contentType.includes("application/json")) {
        const txt = await res.text();
        throw new Error(`Invalid JSON response: ${txt}`);
      }
      const payload = await res.json();
      console.log("RestaurantProvider: settings fetch payload", payload);
      setData(payload);
      console.log("RESTAURANT_DATA =", payload?.restaurant ?? null);
      console.log("RESTAURANT_ID =", payload?.restaurant?.id ?? user?.restaurantId ?? null);
      saveBrandingCache({
        logoUrl: payload?.restaurant?.logoUrl,
        name: payload?.restaurant?.name,
        themeColor: payload?.restaurant?.themeColor,
      });
      logInit("settings", "workspace loaded", {
        restaurantId: payload?.restaurant?.id,
        name: payload?.restaurant?.name,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setIsError(true);
      setError(message);
      warnInit("settings", "fetch failed — app will continue", message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shouldFetchSettings) {
      logInit("restaurant", "fetching settings…", {
        userId: user?.id,
        restaurantId: user?.restaurantId,
      });
      void refetch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldFetchSettings]);

  const settingsPending = shouldFetchSettings && !data && !isError && isLoading;
  const settingsTimedOut = useLoadingTimeout(settingsPending, 3000);

  useEffect(() => {
    if (settingsTimedOut) {
      warnInit("settings", "fetch timeout (3s) — continuing without blocking");
    }
  }, [settingsTimedOut]);

  const isWorkspaceLoading = settingsPending && !settingsTimedOut;

  const settingsError = isError
    ? error?.message ?? String(error) ?? "Failed to load restaurant settings"
    : settingsTimedOut
      ? "Settings load timed out"
      : null;

  const restaurant = data?.restaurant ?? null;
  const owner = data?.owner ?? null;

  const sanitizeDisplayName = (n: string | null | undefined) => {
    if (!n) return "FoodMarket AI";
    if (/test|demo/i.test(n)) return "FoodMarket AI";
    return n;
  };

  const restaurantSanitized = restaurant
    ? { ...restaurant, name: sanitizeDisplayName(restaurant.name) }
    : null;

  const value = useMemo<RestaurantContextValue>(
    () => ({
      restaurant: restaurantSanitized,
      owner,
      restaurantId: restaurant?.id ?? user?.restaurantId ?? null,
      legacyId: restaurant?.legacyId ?? 0,
      isLoading: isWorkspaceLoading,
      isWorkspaceLoading,
      settingsError,
      refetch,
    }),
    [restaurant, owner, user?.restaurantId, isWorkspaceLoading, settingsError, refetch],
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const ctx = useContext(RestaurantContext);
  if (!ctx) {
    throw new Error("useRestaurant must be used within RestaurantProvider");
  }
  return ctx;
}
