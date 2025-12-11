import React from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Thermometer, AlertTriangle, Package } from "lucide-react";

export default function Dashboard() {
  return (
    <div className="space-y-5">
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-[0.7rem] font-medium uppercase tracking-wide text-slate-400">
            Total items
          </p>
          <p className="mt-1 text-3xl font-semibold">182</p>
          <p className="mt-1 text-xs text-slate-400">
            Across all locations and categories.
          </p>
        </Card>
        <Card className="p-4 border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-amber-100/90">
              Low stock
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-1 text-3xl font-semibold text-amber-50">27</p>
          <p className="mt-1 text-xs text-amber-100/80">
            Items at or below minimum level.
          </p>
        </Card>
        <Card className="p-4 border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-slate-900">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-sky-100/90">
              Temperature
            </p>
            <Thermometer className="h-4 w-4 text-sky-200" />
          </div>
          <p className="mt-1 text-3xl font-semibold text-sky-50">4.1°C</p>
          <p className="mt-1 text-xs text-sky-100/80">
            All vaccine fridges within range.
          </p>
        </Card>
      </section>

      <section className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)]">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Recent stock activity
              </p>
              <p className="text-sm text-slate-200">
                Last few items updated or adjusted.
              </p>
            </div>
            <Button variant="ghost" className="text-xs rounded-full px-3">
              View inventory
            </Button>
          </div>
          <div className="space-y-2 text-xs text-slate-300">
            <p>• 12 flu vaccines received at Main site.</p>
            <p>• Dressing packs used in Branch A clinic.</p>
            <p>• Adrenaline stock checked on resus trolley.</p>
          </div>
        </Card>

        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                At-a-glance issues
              </p>
              <p className="text-sm text-slate-200">
                Things that may need action soon.
              </p>
            </div>
            <Package className="h-4 w-4 text-slate-400" />
          </div>
          <div className="space-y-2 text-xs">
            <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-rose-50">
              Adrenaline 1:1000 expired at Main site resus trolley.
            </div>
            <div className="rounded-xl border border-amber-400/40 bg-amber-500/10 px-3 py-2 text-amber-50">
              3 vaccine batches expiring within 14 days.
            </div>
            <div className="rounded-xl border border-slate-700/80 bg-slate-900/80 px-3 py-2 text-slate-200">
              Dressing packs low at Branch A treatment room.
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
