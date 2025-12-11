import React from "react";
import { Card } from "../components/ui/card";
import { AlertTriangle, Calendar, Package, CheckCircle } from "lucide-react";

const mockAlerts = [
  {
    id: 1,
    type: "expired",
    title: "Adrenaline 1:1000 expired",
    message: "Remove from Main site resus trolley and replace immediately.",
    severity: "critical",
  },
  {
    id: 2,
    type: "expiring",
    title: "Flu vaccine batch expiring",
    message: "Adult flu vaccine batch FLU23-184 expires in 10 days.",
    severity: "warning",
  },
  {
    id: 3,
    type: "low_stock",
    title: "Dressing packs low at Branch A",
    message: "Only 14 of 40 packs remaining in treatment room.",
    severity: "warning",
  },
];

export default function Alerts() {
  return (
    <div className="space-y-5 max-w-3xl">
      <section>
        <div className="mb-3 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-[0_0_35px_rgba(251,191,36,0.6)]">
            <AlertTriangle className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
              Alerts
            </h2>
            <p className="text-xs text-slate-400 sm:text-sm">
              Demo view of how stock and expiry alerts will appear.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Card className="p-4 border-rose-500/30 bg-rose-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/30">
                <AlertTriangle className="h-4 w-4 text-rose-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-rose-100">
                  Critical
                </p>
                <p className="text-xl font-semibold text-rose-50">1</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-amber-400/30 bg-amber-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/30">
                <Calendar className="h-4 w-4 text-amber-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-100">
                  Expiry / low
                </p>
                <p className="text-xl font-semibold text-amber-50">2</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-emerald-400/30 bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/30">
                <CheckCircle className="h-4 w-4 text-emerald-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">
                  Clear
                </p>
                <p className="text-xl font-semibold text-emerald-50">Demo</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="space-y-3">
        {mockAlerts.map((alert) => (
          <Card
            key={alert.id}
            className={`p-4 border ${
              alert.severity === "critical"
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-amber-400/40 bg-amber-500/10"
            }`}
          >
            <div className="flex items-start gap-3 text-sm">
              <div className="mt-0.5">
                {alert.type === "expired" || alert.type === "low_stock" ? (
                  <AlertTriangle className="h-4 w-4 text-rose-100" />
                ) : (
                  <Package className="h-4 w-4 text-amber-100" />
                )}
              </div>
              <div>
                <p className="font-semibold text-slate-50">{alert.title}</p>
                <p className="mt-1 text-xs text-slate-100/80">
                  {alert.message}
                </p>
              </div>
            </div>
          </Card>
        ))}
      </section>
    </div>
  );
}
