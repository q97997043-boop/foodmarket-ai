/**
 * api/boot.ts — Hono API server (dev via Vite, prod via Node)
 */

import { Hono } from "hono";
import { cors } from "hono/cors";
import { bodyLimit } from "hono/body-limit";
import type { HttpBindings } from "@hono/node-server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { TRPCError } from "@trpc/server";
import { appRouter } from "./router";
import { createContext } from "./context";
import { env } from "./lib/env";
import { Paths } from "../contracts/constants";
import { registerUser, loginUser } from "./lib/auth-service";
import { logApi, logApiError } from "./lib/log";
import { saveProductImageFile } from "./lib/product-image-upload";
import { verifyAuthHeader } from "./lib/verify-auth-header";
import path from "node:path";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono<{ Bindings: HttpBindings }>();

const publicDir = path.resolve(process.cwd(), "public");
app.use(
  "/uploads/*",
  serveStatic({
    root: publicDir,
    rewriteRequestPath: (requestPath) => requestPath,
  }),
);

app.use(
  "/api/*",
  cors({
    origin: (origin) => origin ?? "*",
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(bodyLimit({ maxSize: 50 * 1024 * 1024 }));

app.get("/api/health", (c) =>
  c.json({ ok: true, service: "FoodMarket AI", time: new Date().toISOString() }),
);

app.get(Paths.oauthCallback, (c) => c.text("oauth callback disabled"));

/** REST fallback — same logic as tRPC, returns JSON for simple clients */
app.post("/api/auth/register", async (c) => {
  try {
    logApi("register", "REST request received");
    const body = await c.req.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");
    const restaurantName = body.restaurantName
      ? String(body.restaurantName).trim()
      : undefined;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters" }, 400);
    }

    const result = await registerUser({ email, password, restaurantName });
    logApi("register", "REST success", { email });
    return c.json(result);
  } catch (err) {
    logApiError("register", "REST failed", err);
    if (err instanceof TRPCError) {
      const status =
        err.code === "CONFLICT" ? 409 : err.code === "BAD_REQUEST" ? 400 : 500;
      return c.json({ error: err.message }, status);
    }
    return c.json(
      { error: err instanceof Error ? err.message : "Registration failed" },
      500,
    );
  }
});

app.post("/api/auth/login", async (c) => {
  try {
    logApi("login", "REST request received");
    const body = await c.req.json();
    const email = String(body.email ?? "").trim();
    const password = String(body.password ?? "");

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const result = await loginUser({ email, password });
    return c.json(result);
  } catch (err) {
    logApiError("login", "REST failed", err);
    if (err instanceof TRPCError) {
      const status = err.code === "UNAUTHORIZED" ? 401 : 500;
      return c.json({ error: err.message }, status);
    }
    return c.json(
      { error: err instanceof Error ? err.message : "Login failed" },
      500,
    );
  }
});

app.post("/api/uploads/product", async (c) => {
  try {
    const user = await verifyAuthHeader(c.req.header("authorization"));
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }
    if (!user.restaurantId) {
      return c.json({ error: "No restaurant linked to this account" }, 403);
    }

    const body = await c.req.parseBody();
    const file = body.file;
    if (!(file instanceof File)) {
      return c.json({ error: "No image file provided" }, 400);
    }

    const nameHint =
      typeof body.nameHint === "string" ? body.nameHint : undefined;
    const url = await saveProductImageFile(file, nameHint);
    logApi("upload", "product image saved", { url, userId: user.id });
    return c.json({ url });
  } catch (err) {
    logApiError("upload", "product image failed", err);
    return c.json(
      {
        error: err instanceof Error ? err.message : "Upload failed",
      },
      400,
    );
  }
});

app.all("/api/trpc/*", async (c) => {
  const path = c.req.path;
  logApi("trpc", `${c.req.method} ${path}`);

  try {
    const response = await fetchRequestHandler({
      endpoint: "/api/trpc",
      req: c.req.raw,
      router: appRouter,
      createContext: (opts) => createContext(opts),
      onError: ({ path: procedurePath, error }) => {
        logApiError("trpc", `procedure error: ${procedurePath}`, error.message);
      },
    });

    return response;
  } catch (err) {
    logApiError("trpc", "handler crash", err);
    return c.json(
      {
        error: {
          message:
            err instanceof Error ? err.message : "Internal server error",
          code: "INTERNAL_SERVER_ERROR",
        },
      },
      500,
    );
  }
});

app.all("/api/*", (c) => c.json({ error: "Not Found", path: c.req.path }, 404));

export default app;

if (env.isProduction) {
  const { serve } = await import("@hono/node-server");
  const { initRealtimeServer } = await import("./realtime/server");
  const { startMarketEngine } = await import("./lib/market-engine");

  const port = parseInt(process.env.PORT || "3000");

  const httpServer = serve({ fetch: app.fetch, port }, () => {
    console.log(`[http] Server running on http://localhost:${port}/`);
    initRealtimeServer(httpServer);
    startMarketEngine();
  });
}
