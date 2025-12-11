import React, { useState, useMemo } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Search, Package, AlertTriangle } from "lucide-react";

const mockItems = [
  {
    id: 1,
    name: "Adult flu vaccine",
    site: "Main site",
    location: "Vaccine fridge",
    current_stock: 84,
    min_stock: 20,
    category: "vaccines",
    expiry_date: "2026-01-18",
  },
  {
    id: 2,
    name: "Adrenaline 1:1000 (EpiPen)",
    site: "Main site",
    location: "Resus trolley",
    current_stock: 2,
    min_stock: 6,
    category: "emergency_drugs",
    expiry_date: "2024-10-01",
  },
  {
    id: 3,
    name: "Dressing packs",
    site: "Branch A",
    location: "Treatment room",
    current_stock: 14,
    min_stock: 40,
    category: "dressings",
    expiry_date: null,
  },
];

export default function Inventory() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return mockItems;
    const q = search.toLowerCase();
    return mockItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.site.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
    );
  }, [search]);

  const lowStock = filtered.filter(
    (item) => item.current_stock > 0 && item.current_stock <= item.min_stock
  );
  const outOfStock = filtered.filter((item) => item.current_stock === 0);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <div className="relative">
            <Input
              placeholder="Search by name, site or location"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="text-xs px-3 py-2">
            Live fridge alerts
          </Button>
          <Button className="text-xs px-3 py-2">+ Add stock item</Button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,2.1fr)_minmax(0,1.2fr)]">
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Card className="p-4">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-slate-400">
                Total items
              </p>
              <p className="mt-1 text-3xl font-semibold">{filtered.length}</p>
              <p className="mt-1 text-xs text-slate-400">
                Matching current filters.
              </p>
            </Card>
            <Card className="p-4 border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-amber-100/90">
                Low stock
              </p>
              <p className="mt-1 text-3xl font-semibold text-amber-50">
                {lowStock.length}
              </p>
              <p className="mt-1 text-xs text-amber-100/80">
                At or below minimum level.
              </p>
            </Card>
            <Card className="p-4 border-rose-500/30 bg-gradient-to-br from-rose-600/15 via-rose-500/10 to-slate-900">
              <p className="text-[0.7rem] font-medium uppercase tracking-wide text-rose-100/90">
                Out of stock
              </p>
              <p className="mt-1 text-3xl font-semibold text-rose-50">
                {outOfStock.length}
              </p>
              <p className="mt-1 text-xs text-rose-100/80">
                Items at zero stock.
              </p>
            </Card>
          </div>

          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Stock overview
              </p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-800/80 px-2 py-1 text-[0.7rem] text-slate-200">
                <Package className="h-3 w-3" />
                Demo data only
              </span>
            </div>

            <div className="space-y-2">
              {filtered.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-950/70 px-3 py-3 text-sm"
                >
                  <div>
                    <p className="font-medium text-slate-50">{item.name}</p>
                    <p className="text-xs text-slate-400">
                      {item.site} • {item.location}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-xs">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 ${
                        item.current_stock === 0
                          ? "bg-rose-500/20 text-rose-100"
                          : item.current_stock <= item.min_stock
                          ? "bg-amber-500/20 text-amber-100"
                          : "bg-emerald-500/20 text-emerald-100"
                      }`}
                    >
                      {item.current_stock} in stock
                    </span>
                    {item.current_stock === 0 && (
                      <span className="inline-flex items-center gap-1 text-rose-100">
                        <AlertTriangle className="h-3 w-3" />
                        Replace urgently
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <aside className="space-y-4">
          <Card className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Suggested actions
              </p>
              <AlertTriangle className="h-4 w-4 text-amber-300" />
            </div>
            <ul className="space-y-1.5 text-xs text-slate-200">
              <li>• Replace expired or out-of-stock emergency drugs.</li>
              <li>• Review vaccine batches nearing expiry.</li>
              <li>• Confirm physical counts for items marked at zero stock.</li>
            </ul>
          </Card>
        </aside>
      </section>
    </div>
  );
}
