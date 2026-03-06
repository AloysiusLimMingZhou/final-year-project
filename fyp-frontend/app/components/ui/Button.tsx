"use client";

import React from "react";
import { motion } from "framer-motion";
import { cx } from "./cx";

export function Button({
  children,
  onClick,
  variant = "primary",
  iconLeft,
  iconRight,
  className,
  style,
  type = "button",
  disabled = false,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost";
  iconLeft?: React.ReactNode;
  iconRight?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";

  const cls =
    variant === "primary"
      ? "text-white"
      : variant === "secondary"
        ? "border bg-transparent"
        : "bg-transparent";

  const varStyle =
    variant === "primary"
      ? { background: "var(--hc-accent)" }
      : variant === "secondary"
        ? { color: "var(--hc-text)", borderColor: "var(--hc-border)" }
        : { color: "var(--hc-text)" };

  return (
    <motion.button
      type={type}
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        onClick?.();
        (e.currentTarget as HTMLButtonElement).blur();
      }}
      whileHover={disabled ? {} : { y: -1 }}
      whileTap={disabled ? {} : { scale: 0.985 }}
      transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
      className={cx(base, cls, className, disabled ? "opacity-50 cursor-not-allowed" : "")}
      style={{ ...(varStyle as any), ...style }}
    >
      {iconLeft}
      {children}
      {iconRight}
    </motion.button>
  );
}
