import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { useLoadingTimeout } from "../hooks/useLoadingTimeout";
import { logInit } from "../lib/init-log";

export function ProtectedRoute() {
  const { user, isLoading, isAuthReady, token } = useAuth();
  const authTimedOut = useLoadingTimeout(isLoading, 3000);

  if (token && isLoading && !authTimedOut) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  if (authTimedOut && token && !user) {
    logInit("auth", "protected route timeout — sending to login");
    return <Navigate to="/login" replace />;
  }

  if (isAuthReady && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
