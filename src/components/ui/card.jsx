import React from "react";
import clsx from "clsx";

export function Card({ className, children, ...props }) {
  const base =
    "rounded-2xl border border-white/10 bg-slate-900/70 shadow-[0_18px_45px_rgba(15,23,42,0.75)] backdrop-blur-xl";
  return (
    <div className={clsx(base, className)} {...props}>
      {children}
    </div>
  );
}
