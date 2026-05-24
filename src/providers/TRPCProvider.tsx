import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpLink, TRPCClientError } from "@trpc/client";
import React, { useState } from "react";
import { trpc } from "../lib/trpc";
import { logInit } from "../lib/init-log";

function getApiUrl() {
  if (import.meta.env.VITE_API_URL) {
    return `${import.meta.env.VITE_API_URL.replace(/\/$/, "")}/api/trpc`;
  }
  if (typeof window !== "undefined") {
    return `${window.location.origin}/api/trpc`;
  }
  return "/api/trpc";
}

function parseFetchError(err: unknown): string {
  if (err instanceof TRPCClientError) {
    return err.message;
  }
  if (err instanceof TypeError && err.message === "Failed to fetch") {
    return "Cannot reach the server. Please verify your network and app deployment.";
  }
  if (err instanceof Error) {
    return err.message;
  }
  return "Request failed";
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 10_000,
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpLink({
          url: getApiUrl(),
          headers() {
            const token = localStorage.getItem("auth-token");
            return {
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            };
          },
          fetch(url, options) {
            logInit("trpc-client", "request", {
              url: String(url),
              method: options?.method ?? "GET",
            });
            return fetch(url, options)
              .then(async (res) => {
                logInit("trpc-client", "response", {
                  url: String(url),
                  status: res.status,
                });
                if (!res.ok) {
                  const text = await res.clone().text();
                  logInit("trpc-client", "error body", text.slice(0, 500));
                }
                return res;
              })
              .catch((err) => {
                logInit("trpc-client", "network error", parseFetchError(err));
                throw err;
              });
          },
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

export { parseFetchError };
