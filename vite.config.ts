/**
 * vite.config.ts  —  UPDATED
 *
 * Change from original: adds `realtimeDevPlugin()` before the Hono dev server
 * plugin so Socket.io is attached to the same HTTP server Vite manages.
 */

import devServer from "@hono/vite-dev-server";
import path from "path";
const __dirname = import.meta.dirname;
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { realtimeDevPlugin } from "./api/realtime/vite-plugin";

export default defineConfig({
  plugins: [
    // ① Attach Socket.io to Vite's HTTP server BEFORE Hono handles requests.
    realtimeDevPlugin(),
    // ② Hono handles /api/* routes.
    devServer({ entry: "api/boot.ts", exclude: [/^\/(?!api\/).*$/] }),
    react(),
  ],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@contracts": path.resolve(__dirname, "./contracts"),
      "@db": path.resolve(__dirname, "./db"),
      db: path.resolve(__dirname, "./db"),
    },
  },
  envDir: path.resolve(__dirname),
  build: {
    outDir: path.resolve(__dirname, "dist/public"),
    emptyOutDir: true,
  },
});
