import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { clsx } from "clsx";

export type ToastState = {
  message: string;
  variant: "success" | "error";
} | null;

type ToastProps = {
  toast: ToastState;
  onDismiss: () => void;
  durationMs?: number;
};

export function Toast({ toast, onDismiss, durationMs = 3200 }: ToastProps) {
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timer);
  }, [toast, onDismiss, durationMs]);

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          className="pointer-events-none fixed bottom-6 left-1/2 z-[100] -translate-x-1/2"
        >
          <motion.div
            role="status"
            className={clsx(
              "pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md",
              toast.variant === "success"
                ? "border-emerald-500/40 bg-emerald-950/95 text-emerald-100"
                : "border-red-500/40 bg-red-950/95 text-red-100",
            )}
          >
            {toast.variant === "success" ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
            )}
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1 opacity-70 hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
