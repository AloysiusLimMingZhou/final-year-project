"use client";

import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown } from "lucide-react";

type Option = { label: string; value: string };

type SoftSelectProps = {
  value: string;
  onChange: (v: string) => void;
  options: Option[];
  leftIcon?: React.ReactNode;
};

export default function SoftSelect({ value, onChange, options, leftIcon }: SoftSelectProps) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const active = options.find((o) => o.value === value)?.label ?? value;

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <motion.button
        type="button"
        onClick={() => setOpen((v) => !v)}
        whileHover={{ y: -1 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "tween", duration: 0.12, ease: "easeOut" }}
        className="w-full rounded-xl border bg-transparent px-3 py-2 text-left text-sm font-semibold"
        style={{ borderColor: "var(--borderSoft)", color: "var(--text)" }}
      >
        <span className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            {leftIcon ? <span style={{ color: "var(--muted)" }}>{leftIcon}</span> : null}
            {active}
          </span>
          <ChevronDown className="h-4 w-4" style={{ color: "var(--muted)" }} />
        </span>
      </motion.button>

      {/* Dropdown */}
      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="absolute z-50 mt-0 w-full overflow-hidden rounded-xl border shadow-sm"
            style={{ background: "var(--surface)", borderColor: "var(--borderSoft)" }}
          >
            <div className="py-1">
              {options.map((o) => {
                const isActive = o.value === value;
                return (
                  <motion.button
                    key={o.value}
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    whileHover={{ x: 2 }}
                    className="w-full px-3 py-2 text-left text-sm"
                    style={{
                      color: "var(--text)",
                      background: isActive ? "rgba(15,23,42,0.04)" : "transparent",
                    }}
                  >
                    {o.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
