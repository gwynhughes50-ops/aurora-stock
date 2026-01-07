import React, { useEffect, useState } from "react";
import { X } from "lucide-react";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { subscribeToMovements } from "@/services/stockService";

function fmt(ts) {
  try {
    const d = ts?.toDate ? ts.toDate() : ts ? new Date(ts) : null;
    return d ? d.toLocaleString() : "";
  } catch {
    return "";
  }
}

export default function StockHistoryDialog({ open, onOpenChange, item }) {
  const [rows, setRows] = useState([]);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (!open || !item?.id) return;

    const unsub = subscribeToMovements(
      item.id,
      (data) => {
        setRows(data);
        setErr(null);
      },
      (e) => setErr(String(e)),
      200
    );

    return () => unsub?.();
  }, [open, item?.id]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-2xl text-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Stock history</p>
            <p className="text-xs text-slate-400">{item?.name || ""}</p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {err && <p className="text-xs text-rose-200 mb-2">{err}</p>}

        <div className="max-h-[60vh] overflow-auto space-y-2">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">No movements recorded yet.</p>
          ) : (
            rows.map((m) => (
              <Card key={m.id} className="p-3 bg-slate-950/40 border border-slate-800">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold capitalize">{m.type}</p>
                    <p className="text-xs text-slate-400">{fmt(m.created_at)}</p>
                  </div>

                  <div className="text-right">
                    {typeof m.delta === "number" && (
                      <p className="text-sm font-semibold">
                        {m.delta > 0 ? `+${m.delta}` : `${m.delta}`}
                      </p>
                    )}
                    {(m.qty_before != null || m.qty_after != null) && (
                      <p className="text-xs text-slate-400">
                        {m.qty_before ?? "—"} → {m.qty_after ?? "—"}
                      </p>
                    )}
                  </div>
                </div>

                {(m.reason || m.notes) && (
                  <p className="mt-2 text-xs text-slate-300">
                    {m.reason ? `Reason: ${m.reason}` : ""}
                    {m.reason && m.notes ? " • " : ""}
                    {m.notes ? m.notes : ""}
                  </p>
                )}
              </Card>
            ))
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}
