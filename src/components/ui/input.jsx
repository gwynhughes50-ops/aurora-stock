import React from "react";
import clsx from "clsx";

export function Input({ className, ...props }) {
  const base =
    "h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 text-sm text-slate-100 placeholder:text-slate-500 shadow-inner shadow-slate-950/70 outline-none focus:border-teal-400/80 focus:ring-2 focus:ring-teal-500/60";
  return <input className={clsx(base, className)} {...props} />;
}
