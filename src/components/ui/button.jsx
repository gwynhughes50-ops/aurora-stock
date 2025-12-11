import React from "react";
import clsx from "clsx";

export function Button({ className, variant = "solid", children, ...props }) {
  const base =
    "inline-flex items-center justify-center rounded-xl text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    solid:
      "bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-md hover:from-teal-400 hover:to-emerald-300",
    ghost: "bg-transparent text-slate-200 hover:bg-slate-800/70",
    outline:
      "border border-slate-700/80 bg-slate-900/60 text-slate-100 hover:bg-slate-800/80",
  };
  return (
    <button
      className={clsx(base, variants[variant] || variants.solid, className)}
      {...props}
    >
      {children}
    </button>
  );
}
