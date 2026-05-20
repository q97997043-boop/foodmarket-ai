import { createRouter } from "./middleware";
import { orderRouter } from "./order-router";
import { menuRouter } from "./menu-router";
import { authRouter } from "./auth-router";
import { settingsRouter } from "./settings-router";
import { dashboardRouter } from "./dashboard-router";
import { marketRouter } from "./market-router";

export const appRouter = createRouter({
  orders: orderRouter,
  menu: menuRouter,
  auth: authRouter,
  settings: settingsRouter,
  dashboard: dashboardRouter,
  market: marketRouter,
});

export type AppRouter = typeof appRouter;
