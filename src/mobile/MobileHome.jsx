import { AlertTriangle, Package, Thermometer, ArrowRight } from "lucide-react";
import useStockSummary from "@/hooks/useStockSummary";

export default function MobileHome() {
    const { totalItems, lowStockItems } = useStockSummary();
  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Aurora Mobile</h1>
        <p className="text-sm text-slate-400">
          Quick actions for busy clinic use
        </p>
      </div>

      {/* Summary Cards */}
<div className="grid grid-cols-2 gap-3">
  <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-emerald-300">
        Stock Items
      </span>
      <Package className="h-4 w-4 text-emerald-300" />
    </div>

    <p className="mt-2 text-3xl font-bold">
      {totalItems}
    </p>
  </div>

  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-amber-300">Low Stock</span>
      <Package className="h-4 w-4 text-amber-300" />
    </div>

    <p className="mt-2 text-3xl font-bold">
      {lowStockItems}
    </p>
  </div>

  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-rose-300">Alerts</span>
      <AlertTriangle className="h-4 w-4 text-rose-300" />
    </div>

    <p className="mt-2 text-3xl font-bold">2</p>
  </div>

  <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
    <div className="flex items-center justify-between">
      <span className="text-xs text-sky-300">
        Temperature
      </span>
      <Thermometer className="h-4 w-4 text-sky-300" />
    </div>

    <p className="mt-2 text-3xl font-bold">0</p>
  </div>
</div>

      {/* Quick Actions */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Quick Actions
        </h2>

        <div className="space-y-3">
          <button className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span>Use Stock</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span>Receive Stock</span>
            <ArrowRight className="h-4 w-4" />
          </button>

          <button className="flex w-full items-center justify-between rounded-2xl border border-slate-800 bg-slate-900 p-4">
            <span>Temperature Log</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent Activity
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">
          Activity feed coming soon...
        </div>
      </div>
    </div>
  );
}