import React from "react";
import { Link, useRouteError } from "react-router-dom";
import { AlertTriangle } from "lucide-react";

export function PageFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-100">
      <div className="rounded-3xl border border-slate-800 bg-slate-900/95 p-8 text-center shadow-xl shadow-slate-950/40">
        <div className="mb-4 text-3xl">⏳</div>
        <h1 className="mb-2 text-xl font-semibold">Loading...</h1>
        <p className="text-slate-400">Your page is on the way.</p>
      </div>
    </div>
  );
}

export function RouteErrorBoundary() {
  const error = useRouteError();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-rose-500/20 bg-slate-900/95 p-8 shadow-2xl shadow-rose-500/10">
        <div className="mb-4 flex items-center gap-3 text-rose-400">
          <AlertTriangle className="h-6 w-6" />
          <h1 className="text-2xl font-bold">Something went wrong</h1>
        </div>
        <p className="mb-6 text-slate-300">
          An unexpected error occurred while rendering this route. Please refresh or try again.
        </p>
        <pre className="mb-6 max-h-40 overflow-auto rounded-2xl bg-slate-950/80 p-4 text-sm text-slate-300">
          {String(error)}
        </pre>
        <div className="flex flex-wrap gap-3">
          <Link
            to="/"
            className="rounded-full bg-emerald-500 px-4 py-2 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Back to Dashboard
          </Link>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-full border border-slate-700 px-4 py-2 text-slate-100 transition hover:border-slate-500"
          >
            Refresh
          </button>
        </div>
      </div>
    </div>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 p-6 text-white">
      <div className="w-full max-w-xl rounded-3xl border border-slate-800 bg-slate-900/95 p-8 shadow-2xl shadow-slate-950/20">
        <div className="mb-6 text-center">
          <div className="mb-2 text-5xl">404</div>
          <h1 className="text-2xl font-semibold">Page not found</h1>
          <p className="mt-2 text-slate-400">
            The page you are looking for does not exist or has been moved.
          </p>
        </div>
        <div className="flex justify-center">
          <Link
            to="/"
            className="rounded-full bg-emerald-500 px-5 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Go back home
          </Link>
        </div>
      </div>
    </div>
  );
}
