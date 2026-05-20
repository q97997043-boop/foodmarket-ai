import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type GlowCardProps = {
  children: React.ReactNode;
  className?: string;
  active?: boolean;
  delay?: number;
};

export function GlowCard({ children, className, active, delay = 0 }: GlowCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className={cn(
        "cyber-glow-card cyber-panel relative rounded-2xl p-4",
        active && "cyber-glow-active",
        className,
      )}
    >
      {children}
    </motion.div>
  );
}
