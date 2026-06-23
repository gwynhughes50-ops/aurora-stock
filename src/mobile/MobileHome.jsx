import { useEffect, useState } from "react";
import { AlertTriangle, Package, Thermometer } from "lucide-react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import useStock from "@/hooks/useStock";
import { db } from "@/lib/firebase";

export default function MobileHome() {
  const { items = [], loading } = useStock({ includeArchived: true });

  const [latestTemp, setLatestTemp] = useState(null);
  const [tempLoading, setTempLoading] = useState(true);
  const [recentMoves, setRecentMoves] = useState([]);

  const activeItems = items.filter(
    (item) =>
      item?.archived_at === null ||
      item?.archived_at === undefined ||
      item?.archived_at === ""
  );

  const totalItems = activeItems.length;

  const lowStockItems = activeItems.filter((item) => {
    const current = Number(item?.current_stock ?? 0);
    const min = Number(item?.min_stock ?? 0);
    return current <= min;
  }).length;

  useEffect(() => {
    const qTemp = query(
      collection(db, "temperature_logs"),
      orderBy("measured_at", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(qTemp, (snap) => {
      const row = snap.docs[0]
        ? { id: snap.docs[0].id, ...snap.docs[0].data() }
        : null;

      setLatestTemp(row);
      setTempLoading(false);
    });

    return () => unsub();
  }, []);
  useEffect(() => {
  const qMoves = query(
    collection(db, "stock_movements"),
    orderBy("created_at", "desc"),
    limit(3)
  );

  const unsub = onSnapshot(qMoves, (snap) => {
    const rows = snap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    setRecentMoves(rows);
  });

  return () => unsub();
}, []);

  const tempValue = latestTemp?.temp;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Aurora Mobile</h1>
        <p className="text-sm text-slate-400">
          Quick actions for busy clinic use
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-300">Stock Items</span>
            <Package className="h-4 w-4 text-emerald-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">
            {loading ? "—" : totalItems}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300">Low Stock</span>
            <Package className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">
            {loading ? "—" : lowStockItems}
          </p>
        </div>

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300">Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">
  {loading || tempLoading ? "—" : lowStockItems}
</p>
        </div>

        <div className="rounded-2xl border border-sky-500/20 bg-sky-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-sky-300">Temperature</span>
            <Thermometer className="h-4 w-4 text-sky-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">
            {tempLoading
              ? "—"
              : tempValue !== undefined && tempValue !== null
              ? `${Number(tempValue).toFixed(1)}°`
              : "0"}
          </p>
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent Activity
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
  {recentMoves.length === 0 ? (
    <p className="text-sm text-slate-400">
      No recent activity
    </p>
  ) : (
    <div className="space-y-2">
      {recentMoves.map((move) => (
        <div
          key={move.id}
          className="border-b border-slate-800 pb-2 last:border-0"
        >
          <div className="text-sm font-medium text-white">
            {move.type === "use" ? "Used" : "Received"}{" "}
            {move.qty || move.quantity || 0}
          </div>

          <div className="text-xs text-slate-400">
            {move.item_name ||
              move.name ||
              move.barcode ||
              "Stock Item"}
          </div>
        </div>
      ))}
    </div>
  )}
</div>
      </div>
    </div>
  );
}