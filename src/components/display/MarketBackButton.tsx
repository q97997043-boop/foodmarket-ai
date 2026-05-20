import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useI18n } from "@/providers/I18nProvider";
import { cn } from "@/lib/utils";

type MarketBackButtonProps = {
  className?: string;
};

export function MarketBackButton({ className }: MarketBackButtonProps) {
  const { t } = useI18n();

  return (
    <motion.div
      className={cn("fixed left-3 top-3 z-[70] md:left-4 md:top-4", className)}
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <Link
        to="/"
        className={cn(
          "group inline-flex items-center gap-2 rounded-xl border border-emerald-500/50",
          "bg-slate-950/90 px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider",
          "text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.25)] backdrop-blur-md",
          "transition-all hover:border-emerald-400 hover:bg-emerald-500/10 hover:text-emerald-300",
          "hover:shadow-[0_0_28px_rgba(16,185,129,0.45)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-emerald-500",
        )}
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        <span className="hidden sm:inline">{t("nav.back")}</span>
        <span className="sm:hidden">{t("nav.backShort")}</span>
      </Link>
    </motion.div>
  );
}
