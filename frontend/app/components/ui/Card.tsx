"use client";

import React from "react";

export function Card({
  title,
  headerRight,
  children,
  className,
}: {
  title?: string;
  headerRight?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl shadow-sm border ${className ?? ""}`}
      style={{
        background: "var(--hc-surface)",
        borderColor: "var(--hc-border)",
      }}
    >
      {title ? (
        <div
          className="border-b px-5 py-4 flex items-center justify-between"
          style={{ borderColor: "var(--hc-border)" }}
        >
          <div className="text-sm font-semibold" style={{ color: "var(--hc-text)" }}>
            {title}
          </div>
          <div>{headerRight}</div>
        </div>
      ) : null}

      <div className="p-5" style={{ color: "var(--hc-text)" }}>
        {children}
      </div>
    </div>
  );
}
