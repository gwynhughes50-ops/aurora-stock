import React, { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Thermometer, AlertTriangle, Package, Barcode, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { collection, limit, onSnapshot, orderBy, query } from "firebase/firestore";

// ✅ Your project uses /src/lib/firebase.js
import { db } from "@/lib/firebase";

// ✅ Use existing stockService helpers
import { useStockByBarcode, applyStockMovement } from "@/services/stockService";

import useStockSummary from "@/hooks/useStockSummary";

export default function Dashboard() {
  const navigate = useNavigate();

  const cardBase =
    "rounded-2xl border border-slate-800/70 bg-slate-900/60 text-slate-100 shadow-sm backdrop-blur";
  const muted = "text-slate-400";
  const sub = "text-slate-300";

  // ✅ Your actual collection names
  const COLLECTIONS = {
    stockItems: "stock_items",
    stockMovements: "stock_movements",
    temperatureLogs: "temperature_logs",
  };

  // ----------------------------
  // ✅ SUMMARY (real hook)
  // ----------------------------
  const {
    totalItems,
    lowStockItems,
    loading: stockLoading,
    error: stockError,
  } = useStockSummary();

  // ----------------------------
  // ✅ RECENT STOCK ACTIVITY
  // ----------------------------
  const [recentMoves, setRecentMoves] = useState([]);
  const [movesLoading, setMovesLoading] = useState(true);
  const [movesError, setMovesError] = useState(null);

  useEffect(() => {
    const qMoves = query(
      collection(db, COLLECTIONS.stockMovements),
      orderBy("created_at", "desc"),
      limit(5)
    );

    const unsub = onSnapshot(
      qMoves,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRecentMoves(rows);
        setMovesLoading(false);
      },
      (err) => {
        setMovesError(err);
        setMovesLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatMove = (m) => {
    const type = String(m?.type || "").toLowerCase();
    const name = m?.item_name || "Item";
    const delta = Number(m?.delta ?? 0);

    if (type === "receive") return `• +${delta} received: ${name}`;
    if (type === "use") return `• -${Math.abs(delta)} used: ${name}`;
    if (type === "create") return `• Created item: ${name}`;
    if (type) return `• ${type}: ${name}`;
    return `• ${name}`;
  };

  // ----------------------------
  // ✅ LOW STOCK DETAILS (client-side)
  // ----------------------------
  const [lowStockDetails, setLowStockDetails] = useState([]);
  const [lowLoading, setLowLoading] = useState(true);
  const [lowError, setLowError] = useState(null);

  useEffect(() => {
    const qItems = query(collection(db, COLLECTIONS.stockItems));

    const unsub = onSnapshot(
      qItems,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const lows = all
          .filter((it) => {
            const cs = Number(it.current_stock ?? 0);
            const ms = Number(it.min_stock ?? 0);
            return Number.isFinite(cs) && Number.isFinite(ms) && cs <= ms;
          })
          .map((it) => {
            const cs = Number(it.current_stock ?? 0);
            const ms = Number(it.min_stock ?? 0);
            const deficit = ms - cs;
            return { ...it, deficit };
          })
          .sort((a, b) => (b.deficit ?? 0) - (a.deficit ?? 0))
          .slice(0, 3);

        setLowStockDetails(lows);
        setLowLoading(false);
      },
      (err) => {
        setLowError(err);
        setLowLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // ✅ EXPIRING SOON (stock_items.expiry_date "YYYY-MM-DD")
  // ----------------------------
  const [expiringSoon, setExpiringSoon] = useState([]);
  const [expLoading, setExpLoading] = useState(true);

  useEffect(() => {
    const qItems = query(collection(db, COLLECTIONS.stockItems));

    const unsub = onSnapshot(
      qItems,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

        const now = new Date();
        const cutoff = new Date(now);
        cutoff.setDate(cutoff.getDate() + 14);

        const parseYMD = (s) => {
          if (!s || typeof s !== "string") return null;
          const [y, m, d] = s.split("-").map((x) => Number(x));
          if (!y || !m || !d) return null;
          return new Date(y, m - 1, d);
        };

        const rows = all
          .map((it) => ({ ...it, _expiryDate: parseYMD(it.expiry_date) }))
          .filter((it) => it._expiryDate && it._expiryDate >= now && it._expiryDate <= cutoff)
          .sort((a, b) => a._expiryDate - b._expiryDate)
          .slice(0, 3);

        setExpiringSoon(rows);
        setExpLoading(false);
      },
      () => {
        setExpiringSoon([]);
        setExpLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ----------------------------
  // ✅ TEMPERATURE (latest measured_at)
  // ----------------------------
  const [latestTemp, setLatestTemp] = useState(null);
  const [tempLoading, setTempLoading] = useState(true);
  const [tempError, setTempError] = useState(null);

  useEffect(() => {
    const qTemp = query(
      collection(db, COLLECTIONS.temperatureLogs),
      orderBy("measured_at", "desc"),
      limit(1)
    );

    const unsub = onSnapshot(
      qTemp,
      (snap) => {
        const row = snap.docs[0] ? { id: snap.docs[0].id, ...snap.docs[0].data() } : null;
        setLatestTemp(row);
        setTempLoading(false);
      },
      (err) => {
        setTempError(err);
        setTempLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tempStatus = useMemo(() => {
    if (tempLoading) return { headline: "—", sub: "Loading temperature…" };
    if (!latestTemp) return { headline: "—", sub: "No temperature logs yet." };

    const t = Number(latestTemp.temp);
    const min = Number(latestTemp?.unitRange?.min);
    const max = Number(latestTemp?.unitRange?.max);

    const within =
      Number.isFinite(t) && Number.isFinite(min) && Number.isFinite(max)
        ? t >= min && t <= max
        : true;

    const unitName = latestTemp.unitName || "Unit";
    const site = latestTemp.site || "";

    return {
      headline: Number.isFinite(t) ? `${t.toFixed(1)}°C` : "—",
      sub: within
        ? `${unitName} within range${site ? ` (${site})` : ""}.`
        : `${unitName} OUT OF RANGE${site ? ` (${site})` : ""}!`,
      within,
    };
  }, [latestTemp, tempLoading]);

  // ----------------------------
  // ✅ AT-A-GLANCE ISSUES (real)
  // ----------------------------
  const issues = useMemo(() => {
    const out = [];

    if (latestTemp && tempStatus?.within === false) {
      out.push({ key: "temp", tone: "rose", text: tempStatus.sub });
    }

    expiringSoon.forEach((it) => {
      out.push({
        key: `exp-${it.id}`,
        tone: "amber",
        text: `${it.name || "Item"} expiring on ${it.expiry_date}${it.site ? ` (${it.site})` : ""}.`,
      });
    });

    lowStockDetails.forEach((it) => {
      out.push({
        key: `low-${it.id}`,
        tone: "slate",
        text: `${it.name || "Item"} low: ${it.current_stock ?? 0}/${it.min_stock ?? 0}${
          it.site ? ` (${it.site})` : ""
        }.`,
      });
    });

    return out.slice(0, 3);
  }, [expiringSoon, lowStockDetails, latestTemp, tempStatus]);

  // ----------------------------
  // ✅ USE STOCK modal state
  // ----------------------------
  const [useOpen, setUseOpen] = useState(false);

  // "scan" | "manual"
  const [useMode, setUseMode] = useState("scan");

  // scan fields
  const [barcode, setBarcode] = useState("");

  // shared qty
  const [qtyRaw, setQtyRaw] = useState("1");

  // manual fields
  const [manualQuery, setManualQuery] = useState("");
  const [manualAllItems, setManualAllItems] = useState([]);
  const [manualLoading, setManualLoading] = useState(false);
  const [manualSelected, setManualSelected] = useState(null);

  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const barcodeRef = useRef(null);
  const qtyRef = useRef(null);
  const manualQueryRef = useRef(null);
  const modalPanelRef = useRef(null);

  const qty = useMemo(() => {
    const n = Number(qtyRaw);
    return Number.isFinite(n) ? n : 0;
  }, [qtyRaw]);

  const resetUseModal = () => {
    setUseMode("scan");
    setBarcode("");
    setQtyRaw("1");
    setManualQuery("");
    setManualSelected(null);
    setMsg(null);
    setBusy(false);
  };

  // Subscribe items ONLY while modal open (for manual lookup)
  useEffect(() => {
    if (!useOpen) return;

    setManualLoading(true);
    const qItems = query(collection(db, COLLECTIONS.stockItems));
    const unsub = onSnapshot(
      qItems,
      (snap) => {
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setManualAllItems(all);
        setManualLoading(false);
      },
      () => {
        setManualAllItems([]);
        setManualLoading(false);
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [useOpen]);

  useEffect(() => {
    if (!useOpen) return;

    const t = setTimeout(() => {
      if (useMode === "scan") barcodeRef.current?.focus();
      else manualQueryRef.current?.focus();
    }, 50);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        setUseOpen(false);
        resetUseModal();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [useOpen, useMode]);

  const onOverlayMouseDown = (e) => {
    if (busy) return;
    const panel = modalPanelRef.current;
    if (!panel) return;
    if (!panel.contains(e.target)) {
      setUseOpen(false);
      resetUseModal();
    }
  };

  const manualFiltered = useMemo(() => {
    const q = String(manualQuery || "").trim().toLowerCase();
    const rows = Array.isArray(manualAllItems) ? manualAllItems : [];
    if (!q) return rows.slice(0, 20);

    return rows
      .filter((it) => {
        const name = String(it?.name || "").toLowerCase();
        const barcode2 = String(it?.barcode || "").toLowerCase();
        const site = String(it?.site || "").toLowerCase();
        const location = String(it?.location || "").toLowerCase();
        const category = String(it?.category || "").toLowerCase();
        return (
          name.includes(q) ||
          barcode2.includes(q) ||
          site.includes(q) ||
          location.includes(q) ||
          category.includes(q)
        );
      })
      .slice(0, 20);
  }, [manualAllItems, manualQuery]);

  async function onConfirmUse() {
    if (busy) return;

    if (!Number.isFinite(qty) || qty <= 0) {
      setMsg({ type: "error", text: "Quantity must be at least 1." });
      qtyRef.current?.focus();
      return;
    }

    setBusy(true);
    setMsg(null);

    try {
      if (useMode === "scan") {
        const code = barcode.trim();
        if (!code) {
          setMsg({ type: "error", text: "Scan a barcode first." });
          barcodeRef.current?.focus();
          setBusy(false);
          return;
        }

        await useStockByBarcode({ barcode: code, qty });

        setMsg({ type: "ok", text: "Saved. Scan next item…" });
        setBarcode("");
        setQtyRaw("1");
        setTimeout(() => barcodeRef.current?.focus(), 50);
        return;
      }

      // manual
      if (!manualSelected?.id) {
        setMsg({ type: "error", text: "Select an item first." });
        manualQueryRef.current?.focus();
        setBusy(false);
        return;
      }

      await applyStockMovement(manualSelected.id, {
        type: "use",
        qty,
        actor: null,
      });

      setMsg({ type: "ok", text: "Saved. You can select another item…" });
      setManualSelected(null);
      setManualQuery("");
      setQtyRaw("1");
      setTimeout(() => manualQueryRef.current?.focus(), 50);
    } catch (e) {
      setMsg({ type: "error", text: String(e?.message || e) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold text-slate-50">Dashboard</div>
          <div className="text-sm text-slate-400">Quick actions for busy clinic use.</div>
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

      {(stockError || movesError || lowError || tempError) && (
        <div className="text-xs text-rose-200 space-y-1">
          {stockError && <div>{String(stockError?.message || stockError)}</div>}
          {movesError && <div>{String(movesError?.message || movesError)}</div>}
          {lowError && <div>{String(lowError?.message || lowError)}</div>}
          {tempError && <div>{String(tempError?.message || tempError)}</div>}
        </div>
      )}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className={`${cardBase} p-4`}>
          <p className={`text-[0.7rem] font-medium uppercase tracking-wide ${muted}`}>
            Total items
          </p>
          <p className="mt-1 text-3xl font-semibold text-slate-50">
            {stockLoading ? "—" : totalItems}
          </p>
          <p className="mt-1 text-xs text-slate-400">Across all locations and categories.</p>
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
          <p className="mt-1 text-xs text-amber-100/80">Items at or below minimum level.</p>
        </Card>

        <Card className="rounded-2xl p-4 border-sky-400/25 bg-gradient-to-br from-sky-500/10 via-cyan-500/5 to-slate-900 text-slate-100">
          <div className="flex items-center justify-between">
            <p className="text-[0.7rem] font-medium uppercase tracking-wide text-sky-100/90">
              Temperature
            </p>
            <Thermometer className="h-4 w-4 text-sky-200" />
          </div>
          <p className="mt-1 text-3xl font-semibold text-sky-50">{tempStatus.headline}</p>
          <p className={`mt-1 text-xs ${tempStatus?.within === false ? "text-rose-200" : "text-sky-100/80"}`}>
            {tempStatus.sub}
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
              <p className={`text-sm ${sub}`}>Latest movements recorded.</p>
            </div>

            <Button
              variant="ghost"
              onClick={() => navigate("/inventory")}
              className="text-xs rounded-full px-3 text-slate-200 hover:bg-slate-800/60 hover:text-slate-50"
            >
              View inventory
            </Button>
          </div>

          <div className="space-y-2 text-xs text-slate-300">
            {movesLoading ? (
              <p className="text-slate-400">Loading activity…</p>
            ) : recentMoves.length === 0 ? (
              <p className="text-slate-400">No recent movements yet.</p>
            ) : (
              recentMoves.map((m) => <p key={m.id}>{formatMove(m)}</p>)
            )}
          </div>
        </Card>

        <Card className={`${cardBase} p-4`}>
          <div className="mb-3 flex items-center justify-between">
            <div>
              <p className={`text-xs font-medium uppercase tracking-wide ${muted}`}>
                At-a-glance issues
              </p>
              <p className={`text-sm ${sub}`}>Live issues from your data.</p>
            </div>
            <Package className="h-4 w-4 text-slate-400" />
          </div>

          <div className="space-y-2 text-xs">
            {lowLoading || expLoading || tempLoading ? (
              <div className="rounded-xl border border-slate-700/80 bg-slate-950/40 px-3 py-2 text-slate-200">
                Loading issues…
              </div>
            ) : issues.length === 0 ? (
              <div className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-emerald-100">
                No issues detected.
              </div>
            ) : (
              issues.map((c) => {
                const tone =
                  c.tone === "rose"
                    ? "border-rose-500/40 bg-rose-500/10 text-rose-50"
                    : c.tone === "amber"
                    ? "border-amber-400/40 bg-amber-500/10 text-amber-50"
                    : "border-slate-700/80 bg-slate-950/40 text-slate-200";

                return (
                  <div key={c.key} className={`rounded-xl border px-3 py-2 ${tone}`}>
                    {c.text}
                  </div>
                );
              })
            )}
          </div>

          <div className="mt-3 flex gap-2">
            <Button
              variant="ghost"
              className="text-xs rounded-full px-3 text-slate-200 hover:bg-slate-800/60 hover:text-slate-50"
              onClick={() => navigate("/inventory")}
            >
              Inventory
            </Button>
            <Button
              variant="ghost"
              className="text-xs rounded-full px-3 text-slate-200 hover:bg-slate-800/60 hover:text-slate-50"
              onClick={() => navigate("/temperature")}
            >
              Temperature
            </Button>
          </div>
        </Card>
      </section>

      {/* ---- USE STOCK MODAL ---- */}
      {useOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur"
          onMouseDown={onOverlayMouseDown}
          role="dialog"
          aria-modal="true"
          aria-label="Use stock modal"
        >
          <div
            ref={modalPanelRef}
            className="w-full max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-50">Use stock</div>
                <div className="text-sm text-slate-400">
                  {useMode === "scan"
                    ? "Scan barcode → quantity → confirm."
                    : "Search/select item → quantity → confirm."}
                </div>
              </div>

              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => {
                  setUseOpen(false);
                  resetUseModal();
                }}
              >
                Close
              </Button>
            </div>

            {/* Mode toggle */}
            <div className="mt-4 flex gap-2">
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMsg(null);
                  setUseMode("scan");
                  setManualSelected(null);
                  setTimeout(() => barcodeRef.current?.focus(), 50);
                }}
                className={`rounded-full px-4 text-xs ${
                  useMode === "scan"
                    ? "bg-slate-100 text-slate-950 hover:bg-white"
                    : "bg-slate-800/60 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Barcode className="h-4 w-4 mr-2" />
                Scan
              </Button>

              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  setMsg(null);
                  setUseMode("manual");
                  setBarcode("");
                  setTimeout(() => manualQueryRef.current?.focus(), 50);
                }}
                className={`rounded-full px-4 text-xs ${
                  useMode === "manual"
                    ? "bg-slate-100 text-slate-950 hover:bg-white"
                    : "bg-slate-800/60 text-slate-200 hover:bg-slate-800"
                }`}
              >
                <Search className="h-4 w-4 mr-2" />
                Manual override
              </Button>
            </div>

            <div className="mt-4 space-y-3">
              {useMode === "scan" ? (
                <div>
                  <label className="text-xs text-slate-300">Barcode</label>
                  <Input
                    ref={barcodeRef}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="Scan barcode…"
                    className="mt-1 bg-slate-950/40 border-slate-800/70 text-slate-100 placeholder:text-slate-500"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        qtyRef.current?.focus();
                        qtyRef.current?.select?.();
                      }
                    }}
                    disabled={busy}
                  />
                  <div className="mt-2 text-[0.7rem] text-slate-500">
                    Tip: most scanners submit an Enter key automatically after the barcode.
                  </div>
                </div>
              ) : (
                <div>
                  <label className="text-xs text-slate-300">Find item</label>
                  <Input
                    ref={manualQueryRef}
                    value={manualQuery}
                    onChange={(e) => {
                      setManualQuery(e.target.value);
                      setManualSelected(null);
                    }}
                    placeholder="Search name, barcode, site, location…"
                    className="mt-1 bg-slate-950/40 border-slate-800/70 text-slate-100 placeholder:text-slate-500"
                    disabled={busy}
                  />

                  <div className="mt-2 max-h-56 overflow-auto rounded-xl border border-slate-800/70 bg-slate-950/30">
                    {manualLoading ? (
                      <div className="px-3 py-2 text-xs text-slate-400">Loading items…</div>
                    ) : manualFiltered.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-400">No matches.</div>
                    ) : (
                      manualFiltered.map((it) => {
                        const selected = manualSelected?.id === it.id;
                        return (
                          <button
                            key={it.id}
                            type="button"
                            disabled={busy}
                            onClick={() => {
                              setManualSelected(it);
                              setMsg(null);
                              setTimeout(() => qtyRef.current?.focus(), 50);
                            }}
                            className={`w-full text-left px-3 py-2 text-xs border-b border-slate-800/60 last:border-b-0 ${
                              selected
                                ? "bg-emerald-500/10 text-emerald-100"
                                : "hover:bg-slate-900/50 text-slate-200"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="truncate font-medium">
                                  {it.name || "Unnamed item"}
                                </div>
                                <div className="truncate text-[0.7rem] text-slate-400">
                                  {it.site ? `${it.site}` : "—"}
                                  {it.location ? ` • ${it.location}` : ""}
                                  {it.barcode ? ` • ${it.barcode}` : ""}
                                </div>
                              </div>
                              <div className="shrink-0 text-[0.7rem] text-slate-400">
                                Stock: {Number(it.current_stock ?? 0)}
                              </div>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {manualSelected?.id && (
                    <div className="mt-2 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                      Selected: <span className="font-medium">{manualSelected.name || "Item"}</span>
                      {manualSelected.site ? ` (${manualSelected.site})` : ""}
                      {manualSelected.location ? ` • ${manualSelected.location}` : ""}
                    </div>
                  )}
                </div>
              )}

              <div>
                <label className="text-xs text-slate-300">Quantity used</label>
                <Input
                  ref={qtyRef}
                  inputMode="numeric"
                  type="number"
                  min={1}
                  value={qtyRaw}
                  onChange={(e) => {
                    const v = e.target.value;
                    setQtyRaw(v === "" ? "" : String(Math.max(1, Number(v))));
                  }}
                  onBlur={() => {
                    const n = Number(qtyRaw);
                    if (!Number.isFinite(n) || n <= 0) setQtyRaw("1");
                    else setQtyRaw(String(Math.floor(n)));
                  }}
                  className="mt-1 bg-slate-950/40 border-slate-800/70 text-slate-100"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      onConfirmUse();
                    }
                  }}
                  disabled={busy}
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
