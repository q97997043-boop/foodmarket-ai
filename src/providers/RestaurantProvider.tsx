import React, { createContext, useContext, useEffect, useMemo } from "react";
import { trpc } from "../lib/trpc";
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

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = trpc.settings.get.useQuery(undefined, {
    enabled: shouldFetchSettings,
    retry: 1,
    retryDelay: 500,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
    onSuccess: (workspace) => {
      logInit("settings", "workspace loaded", {
        restaurantId: workspace.restaurant.id,
        name: workspace.restaurant.name,
      });
      saveBrandingCache({
        logoUrl: workspace.restaurant.logoUrl,
        name: workspace.restaurant.name,
        themeColor: workspace.restaurant.themeColor,
      });
    },
    onError: (err) => {
      warnInit("settings", "fetch failed — app will continue", err.message);
    },
  });

  const settingsPending =
    shouldFetchSettings && !data && !isError && (isLoading || isFetching);
  const settingsTimedOut = useLoadingTimeout(settingsPending, 3000);

  useEffect(() => {
    if (shouldFetchSettings) {
      logInit("restaurant", "fetching settings…", {
        userId: user?.id,
        restaurantId: user?.restaurantId,
      });
    }
  }, [shouldFetchSettings, user?.id, user?.restaurantId]);

  useEffect(() => {
    if (settingsTimedOut) {
      warnInit("settings", "fetch timeout (3s) — continuing without blocking");
    }
  }, [settingsTimedOut]);

  const isWorkspaceLoading = settingsPending && !settingsTimedOut;

  const settingsError = isError
    ? error?.message ?? "Failed to load restaurant settings"
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
