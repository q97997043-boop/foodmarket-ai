/**
 * api/realtime/vite-plugin.ts
 *
 * Vite plugin that attaches the Socket.io server to Vite's dev HTTP server.
 *
 * In development, Vite handles the HTTP server lifecycle.  This plugin hooks
 * into `configureServer` and waits for the server to begin listening, then
 * calls `initRealtimeServer` with the underlying `http.Server` instance.
 *
 * This means Socket.io runs on the SAME port as Vite (3000) in dev —
 * no CORS gymnastics needed, no extra port to manage.
 *
 * Production: Socket.io attaches to the @hono/node-server in boot.ts.
 */

import type { Plugin } from "vite";

export function realtimeDevPlugin(): Plugin {
  return {
    name: "vite-plugin-realtime",
    apply: "serve", // Dev only — build mode skips this plugin.

    configureServer(viteServer) {
      if (!viteServer.httpServer) return;

      // Attach when the server starts listening (not before — the port
      // isn't bound yet at plugin registration time).
      viteServer.httpServer.once("listening", async () => {
        try {
          const { initRealtimeServer } = await import("./server");
          initRealtimeServer(viteServer.httpServer!);
          const { startMarketEngine } = await import("../lib/market-engine");
          startMarketEngine();
        } catch (err) {
          console.error("[realtime] Failed to initialise dev Socket.io server:", err);
        }
      });
    },
  };
}
