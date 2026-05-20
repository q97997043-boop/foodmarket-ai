import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type SettingsSectionProps = {
  title: string;
  description?: string;
  accent?: "emerald" | "cyan" | "violet" | "amber" | "fuchsia";
  children: React.ReactNode;
  className?: string;
};

const accentMap = {
  emerald: "text-emerald-400 border-emerald-500/20",
  cyan: "text-cyan-400 border-cyan-500/20",
  violet: "text-violet-400 border-violet-500/20",
  amber: "text-amber-400 border-amber-500/20",
  fuchsia: "text-fuchsia-400 border-fuchsia-500/20",
};

export function SettingsSection({
  title,
  description,
  accent = "emerald",
  children,
  className,
}: SettingsSectionProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "cyber-glow-card rounded-2xl border bg-slate-900/40 p-6 backdrop-blur-sm",
        accentMap[accent],
        className,
      )}
    >
      <div className="mb-6">
        <h2 className={cn("text-lg font-semibold", accentMap[accent].split(" ")[0])}>
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {children}
    </motion.section>
  );
}
