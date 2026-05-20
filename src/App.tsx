import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { RealtimeProvider } from "./providers/RealtimeProvider";
import { RestaurantProvider } from "./providers/RestaurantProvider";
import { MainLayout } from "./layouts/MainLayout";
import { AuthProvider } from "./providers/AuthProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { useRestaurant } from "./providers/RestaurantProvider";
import { useAuth } from "./providers/AuthProvider";
import { useI18n } from "./providers/I18nProvider";
import { PageFallback, RouteErrorBoundary, NotFoundPage } from "./components/RouteStatus";
import ErrorBoundary from "./components/ErrorBoundary";

const Dashboard = lazy(() => import("./pages/Dashboard").then((m) => ({ default: m.Dashboard })));
const POS = lazy(() => import("./pages/POS").then((m) => ({ default: m.POS })));
const Kitchen = lazy(() => import("./pages/Kitchen").then((m) => ({ default: m.Kitchen })));
const Inventory = lazy(() => import("./pages/Inventory").then((m) => ({ default: m.Inventory })));
const Settings = lazy(() => import("./pages/Settings").then((m) => ({ default: m.default })));
const Login = lazy(() => import("./pages/Login").then((m) => ({ default: m.default })));
const Register = lazy(() => import("./pages/Register").then((m) => ({ default: m.default })));
const Market = lazy(() => import("./pages/Market").then((m) => ({ default: m.Market })));
const TvMode = lazy(() => import("./pages/TvMode").then((m) => ({ default: m.TvMode })));
const CustomerDisplay = lazy(() => import("./pages/CustomerDisplay").then((m) => ({ default: m.CustomerDisplay })));
const QrMenu = lazy(() => import("./pages/QrMenu").then((m) => ({ default: m.default })));

const PUBLIC_PATHS = ["/login", "/register", "/m"];

function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { token } = useAuth();
  const { t } = useI18n();
  const { isWorkspaceLoading, settingsError } = useRestaurant();

  const isPublic =
    PUBLIC_PATHS.some((p) => location.pathname.startsWith(p)) ||
    location.pathname.startsWith("/m/");

  if (!token || isPublic) {
    return <>{children}</>;
  }

  if (isWorkspaceLoading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-950 text-slate-400">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
        <p>{t("workspace.loading")}</p>
      </div>
    );
  }

  if (settingsError) {
    return (
      <>
        <div className="border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          {t("workspace.settingsFallback", { error: settingsError })}
        </div>
        {children}
      </>
    );
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { legacyId, restaurant } = useRestaurant();
  const { token } = useAuth();

  const routes = (
    <WorkspaceGate>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
          <Route path="/login" element={<Login />} errorElement={<RouteErrorBoundary />} />
          <Route path="/register" element={<Register />} errorElement={<RouteErrorBoundary />} />
          <Route path="/m" element={<Navigate to="/" replace />} />
          <Route path="/m/:slug" element={<QrMenu />} errorElement={<RouteErrorBoundary />} />
          <Route path="/dashboard" element={<Navigate to="/" replace />} />
          <Route element={<ProtectedRoute />} errorElement={<RouteErrorBoundary />}>
            <Route path="/tv" element={<TvMode />} />
            <Route path="/display" element={<CustomerDisplay />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="market" element={<Market />} />
              <Route path="pos" element={<POS />} />
              <Route path="kitchen" element={<Kitchen />} />
              <Route path="admin/inventory" element={<Inventory />} />
              <Route path="admin/settings" element={<Settings />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
            </Route>
            <Route path="*" element={<Navigate to={token ? "/" : "/login"} replace />} />
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </WorkspaceGate>
  );

  if (legacyId > 0) {
    return (
      <RealtimeProvider
        restaurantId={legacyId}
        enabled={restaurant?.realtimeEnabled ?? true}
      >
        {routes}
      </RealtimeProvider>
    );
  }

  return routes;
}

function App() {
  return (
    <AuthProvider>
      <RestaurantProvider>
        <AppRoutes />
      </RestaurantProvider>
    </AuthProvider>
  );
}

export default App;
