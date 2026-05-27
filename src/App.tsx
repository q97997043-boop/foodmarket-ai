import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RealtimeProvider } from "./providers/RealtimeProvider";
import { RestaurantProvider } from "./providers/RestaurantProvider";
import { MainLayout } from "./layouts/MainLayout";
import { AuthProvider } from "./providers/AuthProvider";
import { useRestaurant } from "./providers/RestaurantProvider";
import { ProtectedRoute } from "./components/ProtectedRoute";
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

function WorkspaceGate({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AppRoutes() {
  const { legacyId, restaurant } = useRestaurant();

  const routes = (
    <WorkspaceGate>
      <ErrorBoundary>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<Login />} errorElement={<RouteErrorBoundary />} />
            <Route path="/register" element={<Register />} errorElement={<RouteErrorBoundary />} />
            <Route path="/m" element={<Navigate to="/" replace />} />
            <Route path="/m/:slug" element={<QrMenu />} errorElement={<RouteErrorBoundary />} />

            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<MainLayout />}>
                <Route index element={<Dashboard />} />
              </Route>
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

            <Route path="*" element={<Navigate to="/login" replace />} />
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
