import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  logoUrl?: string | null;
  name?: string;
  size?: "sm" | "md" | "lg" | "xl";
  accent?: string;
  className?: string;
  showName?: boolean;
  animate?: boolean;
};

const sizes = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
  xl: "h-20 w-20 text-2xl",
};

export function BrandLogo({
  logoUrl,
  name,
  size = "md",
  accent = "#10b981",
  className,
  showName = false,
  animate = false,
}: BrandLogoProps) {
  const initials =
    name
      ?.split(" ")
      .map((w) => w[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "FM";

  const img = logoUrl ? (
    <motion.img
      key={logoUrl}
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      src={logoUrl}
      alt={name ?? ""}
      className={cn(
        "shrink-0 rounded-xl border border-emerald-500/20 object-cover shadow-[0_0_20px_rgba(0,255,136,0.15)]",
        sizes[size],
        className,
      )}
    />
  ) : (
    <motion.div
      initial={animate ? { opacity: 0, scale: 0.9 } : false}
      animate={{ opacity: 1, scale: 1 }}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-xl font-bold",
        sizes[size],
        className,
      )}
      style={{ backgroundColor: `${accent}22`, color: accent }}
    >
      {initials}
    </motion.div>
  );

  if (!showName) return img;

  return (
    <div className="flex items-center gap-3">
      {img}
      {name && (
        <span className="truncate font-semibold text-white">{name}</span>
      )}
    </div>
  );
}
