import React, { useEffect, useMemo, useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Card } from "../ui/card";
import { X, Minus, Plus } from "lucide-react";

const REASONS = [
  { value: "used", label: "Used / administered" },
  { value: "expired", label: "Expired" },
  { value: "damaged", label: "Damaged" },
  { value: "lost", label: "Lost" },
  { value: "other", label: "Other" },
];

export default function StockMovementDialog({
  open,
  onOpenChange,
  mode = "use", // "use" | "receive"
  item,
  onConfirm,
}) {
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setQty(1);
      setReason("");
      setNotes("");
    }
  }, [open]);

  const current = Number(item?.current_stock || 0);

  const newLevel = useMemo(() => {
    const q = Number(qty || 0);
    return mode === "receive" ? current + q : current - q;
  }, [mode, current, qty]);

  const notEnough = mode === "use" && newLevel < 0;
  const requiresReason = mode === "use" && (notEnough || current === 0);

  const canSubmit = useMemo(() => {
    const q = Number(qty || 0);
    if (!item) return false;
    if (q <= 0) return false;
    if (mode === "use" && q > current) return false;
    if (requiresReason && !reason) return false;
    return true;
  }, [item, qty, mode, current, requiresReason, reason]);

  const close = () => onOpenChange(false);

  const submit = async () => {
    if (!canSubmit || saving) return;
    setSaving(true);
    try {
      await onConfirm({
        mode,
        qty: Number(qty || 0),
        reason: reason || null,
        notes: notes || null,
      });
      close();
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-2xl text-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">
            {mode === "use" ? "Use stock" : "Receive stock"}
          </p>
          <button
            onClick={close}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 hover:bg-slate-700"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Card className="p-3 bg-slate-950/40 border border-slate-800">
          <p className="font-semibold">{item?.name || "Item"}</p>
          <p className="text-sm text-slate-300">
            Current stock: {current}
          </p>
        </Card>

        <div className="mt-4 space-y-3">
          <div>
            <p className="text-xs text-slate-400 mb-1">Quantity</p>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQty((q) => Math.max(1, Number(q || 1) - 1))}
              >
                <Minus className="h-4 w-4" />
              </Button>

              <Input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                className="text-center"
                min={1}
              />

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setQty((q) => Number(q || 1) + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div
            className={`rounded-xl border p-3 ${
              notEnough
                ? "border-rose-500/40 bg-rose-500/10"
                : "border-slate-800 bg-slate-950/30"
            }`}
          >
            <div className="flex justify-between">
              <span>New stock level</span>
              <span className="font-semibold">
                {Math.max(0, newLevel)}
              </span>
            </div>
            {notEnough && (
              <p className="mt-2 text-xs text-rose-200">
                Not enough stock available
              </p>
            )}
          </div>

          {mode === "use" && (
            <div>
              <p className="text-xs text-slate-400 mb-1">
                Reason {requiresReason ? "*" : ""}
              </p>
              <select
                className="h-10 w-full rounded-xl border border-slate-700 bg-slate-900 px-3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              >
                <option value="">Select reason…</option>
                {REASONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <p className="text-xs text-slate-400 mb-1">Notes (optional)</p>
            <textarea
              className="min-h-[80px] w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={!canSubmit || saving}
            className={mode === "use" ? "bg-amber-500 text-slate-950" : ""}
          >
            {saving ? "Saving…" : mode === "use" ? "Use stock" : "Receive stock"}
          </Button>
        </div>
      </div>
    </div>
  );
}
