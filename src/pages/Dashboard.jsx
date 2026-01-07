import React, { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Thermometer, AlertTriangle, Package, Barcode } from "lucide-react";
import { useStockByBarcode } from "@/services/stockService";
import useStockSummary from "@/hooks/useStockSummary";

export default function Dashboard() {
  const cardBase =
    "rounded-2xl border border-slate-800/70 bg-slate-900/60 text-slate-100 shadow-sm backdrop-blur";
  const muted = "text-slate-400";
  const sub = "text-slate-300";

  const {
    totalItems,
    lowStockItems,
    loading: stockLoading,
    error: stockError,
  } = useStockSummary();

  // ---- USE STOCK modal state
  const [useOpen, setUseOpen] = useState(false);
  const [barcode, setBarcode] = useState("");
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null); // success / error message

  const barcodeRef = useRef(null);

  useEffect(() => {
    if (useOpen) {
      setTimeout(() => barcodeRef.current?.focus(), 50);
    }
  }, [useOpen]);

  const resetUseModal = () => {
    setBarcode("");
    setQty(1);
    setBusy(false);
    setMsg(null);
  };

  async function onConfirmUse() {
    const code = barcode.trim();
    const n = Number(qty);

    if (!code) {
      setMsg({ type: "error", text: "Scan a barcode first." });
      return;
    }
    if (!Number.isFinite(n) || n <= 0) {
      setMsg({ type: "error", text: "Quantity must be at least 1." });
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      await useStockByBarcode({ barcode: code, qty: n });

      // fast repeat scanning
      setMsg({ type: "ok", text: "Saved. Scan next item…" });
      setBarcode("");
      setQty(1);
      setTimeout(() => barcodeRef.current?.focus(), 50);
    } catch (e) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* ✅ PROMINENT USE STOCK BUTTON */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-50">Dashboard</div>
          <div className="text-sm text-slate-400">
            Quick actions for busy clinic use.
          </div>
        </div>

        <Button
          onClick={() => {
            resetUseModal();
            setUseOpen(true);
          }}
          className="rounded-2xl px-6 py-6 text-base font-semibold bg-gradient-to-r from-teal-500 to-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25"
        >
          <Barcode className="h-5 w-5 mr-2" />
          USE STOCK
        </Button>
      </div>

      {/* Optional: show stock summary errors */}
      {stockError && (
        <div className="text-xs text-rose-200">
          {String(stockError?.message || stockError)}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {/* ✅ FIXED: missing <Card> wrapper */}
        <Card className={`${cardBase} p-4`}>
          <p className={`text-[0.7rem] font-medium uppercase tracking-wide ${muted}`}>
            Total items
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-50">
            {stockLoading ? "—" : totalItems}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Across all locations and categories.
          </p>
        </Card>

        <Card className="rounded-2xl p-4 border-amber-400/25 bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-slate-900 text-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-amber-100/90">
              Low stock
            </p>
            <AlertTriangle className="h-4 w-4 text-amber-200" />
          </div>
          <p className="mt-1 text-3xl font-semibold text-amber-50">
            {stockLoading ? "—" : lowStockItems}
          </p>
          <p className="mt-1 text-xs text-amber-100/80">
            Items at or below minimum level.
          </p>
        </Card>

        <Card className="rounded-2xl p-4 border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-slate-900 text-slate-100">
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
        <Card className={`${cardBase} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>
                Recent stock activity
              </p>
              <p className={`text-sm ${sub}`}>
                Last few items updated or adjusted.
              </p>
            </div>

            <Button
              variant="ghost"
              className="text-xs rounded-full px-3 text-slate-200 hover:bg-slate-800/60 hover:text-slate-50"
            >
              View inventory
            </Button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            <p>• 12 flu vaccines received at Main site.</p>
            <p>• Dressing packs used in Branch A clinic.</p>
            <p>• Adrenaline stock checked on resus trolley.</p>
          </div>
        </Card>

        <Card className={`${cardBase} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>
                At-a-glance issues
              </p>
              <p className={`text-sm ${sub}`}>
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
            <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-slate-200">
              Dressing packs low at Branch A treatment room.
            </div>
          </div>
        </Card>
      </section>

      {/* ---- USE STOCK MODAL ---- */}
      {useOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-50">Use stock</div>
                <div className="text-sm text-slate-400">
                  Scan barcode → quantity → confirm.
                </div>
              </div>

              <Button
                variant="ghost"
                onClick={() => {
                  setUseOpen(false);
                  resetUseModal();
                }}
              >
                Close
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              <div>
                <label className="text-xs text-slate-300">Barcode</label>
                <Input
                  ref={barcodeRef}
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="Scan barcode…"
                  className="mt-1 bg-slate-950/40 border-slate-800/70 text-slate-100 placeholder:text-slate-500"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirmUse();
                  }}
                />
              </div>

              <div>
                <label className="text-xs text-slate-300">Quantity used</label>
                <Input
                  type="number"
                  min={1}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(1, Number(e.target.value || 1)))
                  }
                  className="mt-1 bg-slate-950/40 border-slate-800/70 text-slate-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onConfirmUse();
                  }}
                />
              </div>

              {msg?.type === "error" && (
                <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">
                  {msg.text}
                </div>
              )}
              {msg?.type === "ok" && (
                <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                  {msg.text}
                </div>
              )}

              <Button
                disabled={busy}
                onClick={onConfirmUse}
                className="w-full rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950"
              >
                {busy ? "Saving…" : "Confirm use"}
              </Button>

              <div className="text-[0.7rem] text-slate-500">
                Tip: most scanners submit an Enter key automatically after the
                barcode.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

