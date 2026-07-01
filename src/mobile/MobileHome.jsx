import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Package, ShoppingCart, Thermometer, Truck } from "lucide-react";
import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

import useStock from "@/hooks/useStock";
import { db } from "@/lib/firebase";

export default function MobileHome({ onSelectItem }) {
  const { allItems = [], loading } = useStock({ includeArchived: false });

  const [latestTemp, setLatestTemp] = useState(null);
  const [tempLoading, setTempLoading] = useState(true);
  const [recentMoves, setRecentMoves] = useState([]);
  const [reorderRequests, setReorderRequests] = useState([]);
  const [purchaseOrders, setPurchaseOrders] = useState([]);

  const totalItems = allItems.length;

  const lowStockList = useMemo(() => {
    return allItems
      .filter((item) => {
        const current = Number(item.current_stock || 0);
        const min = Number(item.min_stock || 0);

        return current <= min;
      })
      .sort((a, b) => {
        const aGap = Number(a.current_stock || 0) - Number(a.min_stock || 0);
        const bGap = Number(b.current_stock || 0) - Number(b.min_stock || 0);

        return aGap - bGap;
      });
  }, [allItems]);

  const lowStockCount = lowStockList.length;

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

  useEffect(() => {
    const qRequests = query(collection(db, "reorder_requests"), limit(100));

    const unsub = onSnapshot(qRequests, (snap) => {
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReorderRequests(rows);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const qOrders = query(collection(db, "purchase_orders"), limit(100));

    const unsub = onSnapshot(qOrders, (snap) => {
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPurchaseOrders(rows);
    });

    return () => unsub();
  }, []);

  const pendingReorders = reorderRequests.filter(
    (request) => (request.status || "pending") === "pending"
  ).length;

  const awaitingDeliveries = purchaseOrders.filter((order) =>
    ["sent", "awaiting_delivery", "part_delivered"].includes(order.status || "")
  ).length;

  const tempValue = latestTemp?.temp;

  return (
    <div className="min-h-screen bg-slate-950 p-4 pb-24 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">MedTrak+ Mobile</h1>
        <p className="text-sm text-slate-400">
Quick actions for MedTrak+ stock and purchasing
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

        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-rose-300">Alerts</span>
            <AlertTriangle className="h-4 w-4 text-rose-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">
            {loading || tempLoading ? "—" : lowStockCount}
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

        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-amber-300">Reorder Requests</span>
            <ShoppingCart className="h-4 w-4 text-amber-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">{pendingReorders}</p>
        </div>

        <div className="rounded-2xl border border-violet-500/20 bg-violet-500/10 p-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-violet-300">Awaiting Delivery</span>
            <Truck className="h-4 w-4 text-violet-300" />
          </div>
          <p className="mt-2 text-3xl font-bold">{awaitingDeliveries}</p>
        </div>

        <div className="relative z-[60] rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">Low Stock</h3>

            <span className="rounded-full bg-rose-500 px-2 py-1 text-xs font-bold text-white">
              {loading ? "—" : lowStockCount}
            </span>
          </div>

          {loading ? (
            <p className="mt-2 text-sm text-slate-300">Loading...</p>
          ) : lowStockList.length === 0 ? (
            <p className="mt-2 text-sm text-slate-300">
              No low stock items 🎉
            </p>
          ) : (
            <div className="mt-3 space-y-2">
              {lowStockList.slice(0, 5).map((item) => (
                <button
  key={item.id}
  type="button"
  onClick={() => onSelectItem?.(item)}
  className="flex w-full justify-between gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-slate-800"
>
                
                  <span className="truncate text-white">{item.name}</span>

                  <span className="shrink-0 text-rose-200">
                    {item.current_stock ?? 0} / {item.min_stock ?? 0}
                  </span>
                </button>
              ))}

              {lowStockList.length > 5 && (
                <div className="text-xs text-slate-400">
                  + {lowStockList.length - 5} more
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Recent Activity
        </h2>

        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
          {recentMoves.length === 0 ? (
            <p className="text-sm text-slate-400">No recent activity</p>
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
                    {move.item_name || move.name || move.barcode || "Stock Item"}
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