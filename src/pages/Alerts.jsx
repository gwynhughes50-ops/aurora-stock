import React, { useEffect, useMemo, useState } from "react";
import { Card } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  AlertTriangle,
  Calendar,
  Package,
  CheckCircle,
  Thermometer,
  Settings,
  Mail,
  X,
} from "lucide-react";

import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  query,
  orderBy,
  limit,
  deleteDoc,
} from "firebase/firestore";

import { onAuthStateChanged } from "firebase/auth";
import { db, auth } from "../lib/firebase";

/**
 * Collections used:
 * - stock_items
 * - temperature_logs
 * - alert_resolutions   (practice-wide resolved state)
 * - users               (profiles; role lives here)
 * - settings/alerts     (practice-wide alerts config)
 */
const STOCK_COL = "stock_items";
const TEMP_COL = "temperature_logs";
const RESOLUTIONS_COL = "alert_resolutions";
const USERS_COL = "users";
const SETTINGS_DOC_PATH = "settings/alerts";

/**
 * Defaults for "expiring soon" thresholds.
 * Stored practice-wide in Firestore (settings/alerts) with these defaults as fallback.
 */
const DEFAULT_EXPIRY_SOON_DAYS = 30;

const DEFAULT_CATEGORY_THRESHOLDS = {
  medicinal: 30,
  vaccines: 30,
  emergency_drugs: 60,
  dressings: 30,
  equipment: 0,
  non_medical: 0,
};

/**
 * Temperature ranges fallback.
 * If your temperature_logs store unitRange, we use it.
 */
const DEFAULT_TEMP_RANGES = {
  fridge: { min: 2, max: 8 },
  freezer20: { min: -25, max: -15 },
  freezer40: { min: -45, max: -35 },
  freezer: { min: -25, max: -15 },
};

/* -------------------- helpers -------------------- */

function firstDefined(obj, keys) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function parseMaybeDate(value) {
  if (!value) return null;

  if (value?.toDate && typeof value.toDate === "function") {
    const d = value.toDate();
    return Number.isNaN(d.getTime()) ? null : d;
  }

  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function safeNumber(value) {
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

function formatDate(d) {
  try {
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return "";
  }
}

function formatDateTime(d) {
  try {
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function daysBetween(a, b) {
  const ms = b.getTime() - a.getTime();
  return Math.floor(ms / 86400000);
}

function severityRank(sev) {
  return sev === "critical" ? 0 : 1;
}

function getTempStatus(unitRange, tempC) {
  const t = Number(tempC);
  if (Number.isNaN(t) || !unitRange) return { label: "Unknown", severity: "warning" };

  const { min, max } = unitRange;
  if (t < min || t > max) return { label: "Out of range", severity: "critical" };

  const span = max - min;
  const margin = span * 0.1;
  if (t < min + margin || t > max - margin) return { label: "Borderline", severity: "warning" };

  return { label: "In range", severity: "ok" };
}

/* -------------------- component -------------------- */

export default function Alerts() {
  // Auth + profile
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const isAdmin = useMemo(() => {
    return String(profile?.role || "").toLowerCase() === "system admin";
  }, [profile]);

  const resolvedByLabel = useMemo(() => {
    const email = authUser?.email;
    const name = authUser?.displayName;
    if (name && email) return `${name} (${email})`;
    return email || name || "user";
  }, [authUser]);

  // Data
  const [stockItems, setStockItems] = useState([]);
  const [tempLogs, setTempLogs] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [tempError, setTempError] = useState("");

  // Resolved alerts map: { [alertId]: { resolved_at, resolved_by } }
  const [resolvedMap, setResolvedMap] = useState({});

  // Toggle: active vs resolved
  const [view, setView] = useState("active"); // "active" | "resolved"

  // Settings UI
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Practice-wide settings (live + editable draft)
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsError, setSettingsError] = useState("");

  // Live values (used by alerts generation)
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [globalExpirySoonDays, setGlobalExpirySoonDays] = useState(DEFAULT_EXPIRY_SOON_DAYS);
  const [categoryThresholds, setCategoryThresholds] = useState(DEFAULT_CATEGORY_THRESHOLDS);

  // Draft values (edited in modal; only saved when clicking Save)
  const [draftEmailEnabled, setDraftEmailEnabled] = useState(false);
  const [draftGlobalExpirySoonDays, setDraftGlobalExpirySoonDays] = useState(DEFAULT_EXPIRY_SOON_DAYS);
  const [draftCategoryThresholds, setDraftCategoryThresholds] = useState(DEFAULT_CATEGORY_THRESHOLDS);
  const [savingSettings, setSavingSettings] = useState(false);

  // -------------------------
  // Auth subscription
  // -------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  // Profile subscription: users/{uid}
  useEffect(() => {
    if (!authUser?.uid) {
      setProfile(null);
      return;
    }

    const ref = doc(db, USERS_COL, authUser.uid);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setProfile(snap.exists() ? snap.data() : null);
      },
      (err) => {
        console.error("Alerts profile subscribe error:", err);
        setProfile(null);
      }
    );

    return () => unsub();
  }, [authUser?.uid]);

  // -------------------------
  // Subscribe: practice-wide settings doc
  // -------------------------
  useEffect(() => {
    const ref = doc(db, SETTINGS_DOC_PATH);
    const unsub = onSnapshot(
      ref,
      (snap) => {
        setSettingsError("");
        setSettingsLoading(false);

        const data = snap.exists() ? snap.data() : {};

        // Merge with defaults so the UI always has keys
        const mergedEmail = data?.email_enabled ?? false;
        const mergedGlobal = safeNumber(data?.global_expiry_days);
        const mergedCats = data?.category_expiry_days || {};

        const liveEmail = Boolean(mergedEmail);
        const liveGlobal = mergedGlobal === null ? DEFAULT_EXPIRY_SOON_DAYS : Math.max(0, mergedGlobal);

        const liveCats = {
          ...DEFAULT_CATEGORY_THRESHOLDS,
          ...(typeof mergedCats === "object" && mergedCats ? mergedCats : {}),
        };

        setEmailEnabled(liveEmail);
        setGlobalExpirySoonDays(liveGlobal);
        setCategoryThresholds(liveCats);

        // If modal isn't open, keep draft in sync with live
        // (so user always starts editing current values)
        if (!settingsOpen) {
          setDraftEmailEnabled(liveEmail);
          setDraftGlobalExpirySoonDays(liveGlobal);
          setDraftCategoryThresholds(liveCats);
        }
      },
      (err) => {
        console.error("Alerts settings subscribe error:", err);
        setSettingsLoading(false);
        setSettingsError(String(err?.message || err));
      }
    );

    return () => unsub();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen]);

  // When opening the modal, copy live -> draft
  useEffect(() => {
    if (settingsOpen) {
      setDraftEmailEnabled(emailEnabled);
      setDraftGlobalExpirySoonDays(globalExpirySoonDays);
      setDraftCategoryThresholds(categoryThresholds);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settingsOpen]);

  async function savePracticeSettings() {
    if (!authUser) {
      alert("You must be signed in.");
      return;
    }
    if (!isAdmin) {
      alert("Only System Admin can change practice-wide settings.");
      return;
    }

    setSavingSettings(true);
    try {
      await setDoc(
        doc(db, SETTINGS_DOC_PATH),
        {
          email_enabled: Boolean(draftEmailEnabled),
          global_expiry_days: Math.max(0, Number(draftGlobalExpirySoonDays || 0)),
          category_expiry_days: draftCategoryThresholds || DEFAULT_CATEGORY_THRESHOLDS,
          updated_at: serverTimestamp(),
          updated_by: resolvedByLabel,
        },
        { merge: true }
      );
      setSettingsOpen(false);
    } catch (err) {
      console.error("Save settings failed:", err);
      alert(`Could not save settings (check Firestore rules): ${String(err?.message || err)}`);
    } finally {
      setSavingSettings(false);
    }
  }

  // -------------------------
  // Subscribe: stock_items
  // -------------------------
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, STOCK_COL),
      (snap) => {
        setLoadError("");
        setStockItems(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Alerts stock_items subscribe error:", err);
        setLoadError(String(err?.message || err));
      }
    );

    return () => unsub();
  }, []);

  // -------------------------
  // Subscribe: temperature_logs
  // -------------------------
  useEffect(() => {
    const qy = query(collection(db, TEMP_COL), orderBy("created_at", "desc"), limit(200));

    const unsub = onSnapshot(
      qy,
      (snap) => {
        setTempError("");
        setTempLogs(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      },
      (err) => {
        console.error("Alerts temperature_logs subscribe error:", err);
        setTempError(String(err?.message || err));
      }
    );

    return () => unsub();
  }, []);

  // -------------------------
  // Subscribe: alert_resolutions
  // -------------------------
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, RESOLUTIONS_COL),
      (snap) => {
        const next = {};
        snap.docs.forEach((d) => (next[d.id] = d.data()));
        setResolvedMap(next);
      },
      (err) => {
        console.error("Alerts alert_resolutions subscribe error:", err);
      }
    );
    return () => unsub();
  }, []);

  // Build GENERATED alerts (then we subtract resolved for "Active" view)
  const generatedAlerts = useMemo(() => {
    const now = new Date();
    const list = [];

    // ------------ STOCK ALERTS ------------
    for (const item of stockItems) {
      // ✅ Ignore archived items
      if (item?.archived_at) continue;

      const name =
        firstDefined(item, ["name", "item_name", "title", "product_name"]) || "Unnamed item";

      const site =
        firstDefined(item, ["site", "siteName", "site_id", "siteId"]) || "Unknown site";

      const location =
        firstDefined(item, ["location", "locationName", "location_id", "locationId"]) || "";

      const category =
        String(firstDefined(item, ["category", "categoryKey", "category_key"]) || "").trim() ||
        "unknown";

      const currentStock =
        safeNumber(firstDefined(item, ["current_stock", "currentStock", "qty", "quantity"])) ?? null;

      const minStock =
        safeNumber(firstDefined(item, ["min_stock", "minStock", "reorder_level", "reorderLevel"])) ??
        null;

      const expiryRaw = firstDefined(item, [
        "expiry_date",
        "expiryDate",
        "expires_at",
        "expiresAt",
        "expiry",
      ]);
      const expiryDate = parseMaybeDate(expiryRaw);

      let soonDays = globalExpirySoonDays;
      const perCat = safeNumber(categoryThresholds?.[category]);
      if (perCat !== null && perCat > 0) soonDays = perCat;

      const soonCutoff = new Date(now.getTime() + soonDays * 86400000);

      if (expiryDate) {
        if (expiryDate < now) {
          list.push({
            id: `expired-stock-${item.id}`,
            source: "stock",
            type: "expired",
            severity: "critical",
            title: `${name} expired`,
            message: `Expired on ${formatDate(expiryDate)}. Remove from ${site}${
              location ? ` • ${location}` : ""
            } and replace immediately.`,
            sortTime: expiryDate.getTime(),
          });
        } else if (soonDays > 0 && expiryDate <= soonCutoff) {
          const days = daysBetween(now, expiryDate);
          list.push({
            id: `expiring-stock-${item.id}`,
            source: "stock",
            type: "expiring",
            severity: "warning",
            title: `${name} expiring soon`,
            message: `Expires in ${days} day${days === 1 ? "" : "s"} (${formatDate(
              expiryDate
            )}). Check rotation at ${site}${location ? ` • ${location}` : ""}.`,
            sortTime: expiryDate.getTime(),
          });
        }
      }

      if (currentStock !== null && minStock !== null) {
        if (currentStock <= 0) {
          list.push({
            id: `outofstock-stock-${item.id}`,
            source: "stock",
            type: "low_stock",
            severity: "critical",
            title: `${name} out of stock`,
            message: `0 remaining (min ${minStock}). Reorder for ${site}${
              location ? ` • ${location}` : ""
            }.`,
            sortTime: now.getTime(),
          });
        } else if (currentStock <= minStock) {
          list.push({
            id: `lowstock-stock-${item.id}`,
            source: "stock",
            type: "low_stock",
            severity: "warning",
            title: `${name} low stock`,
            message: `Only ${currentStock} remaining (min ${minStock}) at ${site}${
              location ? ` • ${location}` : ""
            }.`,
            sortTime: now.getTime(),
          });
        }
      }
    }

    // ------------ TEMPERATURE ALERTS ------------
    const latestByUnit = new Map();
    for (const log of tempLogs) {
      const unitId = firstDefined(log, ["unitId", "unit_id", "unit"]) || "";
      if (!unitId) continue;
      if (!latestByUnit.has(unitId)) latestByUnit.set(unitId, log);
    }

    for (const log of latestByUnit.values()) {
      const dt =
        log?.measured_at?.toDate?.() ||
        log?.created_at?.toDate?.() ||
        (log?.datetime ? new Date(log.datetime) : null);

      const tempValue = firstDefined(log, ["temp", "temperature"]);
      const tNum = safeNumber(tempValue);

      const unitRange = firstDefined(log, ["unitRange"]) || null;

      const unitType = String(firstDefined(log, ["unitType", "unit_type"]) || "fridge");
      const fallbackRange =
        DEFAULT_TEMP_RANGES[unitType] ||
        (unitType === "freezer" ? DEFAULT_TEMP_RANGES.freezer : DEFAULT_TEMP_RANGES.fridge);

      const rangeToUse = unitRange || fallbackRange;

      const status = getTempStatus(rangeToUse, tNum);
      if (status.severity === "ok") continue;

      const site = firstDefined(log, ["siteId", "site", "siteName"]) || "Unknown site";
      const unitName =
        firstDefined(log, ["unitName", "unit_name"]) || (firstDefined(log, ["unitId"]) || "Unit");

      const rangeLabel = rangeToUse ? `${rangeToUse.min} to ${rangeToUse.max}°C` : "—";

      list.push({
        id: `temp-${log.id}`,
        source: "temperature",
        type: status.label === "Out of range" ? "temp_out" : "temp_borderline",
        severity: status.severity === "critical" ? "critical" : "warning",
        title: `${unitName} temperature ${status.label.toLowerCase()}`,
        message: `${tNum ?? "—"} °C (range ${rangeLabel}) • ${site} • ${
          dt ? formatDateTime(dt) : "Unknown time"
        }`,
        sortTime: dt ? dt.getTime() : now.getTime(),
      });
    }

    list.sort((a, b) => {
      const s = severityRank(a.severity) - severityRank(b.severity);
      if (s !== 0) return s;
      return (a.sortTime || 0) - (b.sortTime || 0);
    });

    return list;
  }, [stockItems, tempLogs, globalExpirySoonDays, categoryThresholds]);

  const activeAlerts = useMemo(() => {
    return generatedAlerts.filter((a) => !resolvedMap?.[a.id]);
  }, [generatedAlerts, resolvedMap]);

  const resolvedAlerts = useMemo(() => {
    const entries = Object.entries(resolvedMap || {}).map(([id, meta]) => ({ id, meta }));
    const byId = new Map(generatedAlerts.map((a) => [a.id, a]));
    const now = new Date();

    const rows = entries.map(({ id, meta }) => {
      const gen = byId.get(id);

      const resolvedAt =
        meta?.resolved_at?.toDate?.() || (meta?.resolved_at ? new Date(meta.resolved_at) : null);

      return {
        id,
        title: gen?.title || id,
        message: gen?.message || "This alert is currently not active (condition cleared).",
        severity: gen?.severity || "warning",
        source: gen?.source || "unknown",
        sortTime: resolvedAt ? resolvedAt.getTime() : now.getTime(),
        resolved_by: meta?.resolved_by || "—",
        resolved_at: resolvedAt,
      };
    });

    rows.sort((a, b) => (b.sortTime || 0) - (a.sortTime || 0));
    return rows;
  }, [resolvedMap, generatedAlerts]);

  const counts = useMemo(() => {
    const critical = activeAlerts.filter((a) => a.severity === "critical").length;
    const warn = activeAlerts.filter((a) => a.severity !== "critical").length;
    const temp = activeAlerts.filter((a) => a.source === "temperature").length;
    const stock = activeAlerts.filter((a) => a.source === "stock").length;
    return {
      critical,
      warn,
      total: activeAlerts.length,
      temp,
      stock,
      resolved: resolvedAlerts.length,
    };
  }, [activeAlerts, resolvedAlerts]);

  async function resolveAlert(alertId) {
    if (!authUser) {
      alert("You must be signed in to resolve alerts.");
      return;
    }
    try {
      await setDoc(doc(db, RESOLUTIONS_COL, alertId), {
        resolved_at: serverTimestamp(),
        resolved_by: resolvedByLabel,
      });
    } catch (err) {
      console.error("Resolve alert failed:", err);
      alert(`Could not resolve alert (check Firestore rules): ${String(err?.message || err)}`);
    }
  }

  async function unresolveAlert(alertId) {
    if (!authUser) {
      alert("You must be signed in.");
      return;
    }
    if (!isAdmin) {
      alert("Only System Admin can unresolve alerts.");
      return;
    }
    try {
      await deleteDoc(doc(db, RESOLUTIONS_COL, alertId));
    } catch (err) {
      console.error("Unresolve failed:", err);
      alert(`Could not unresolve alert (check Firestore rules): ${String(err?.message || err)}`);
    }
  }

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-orange-400 to-rose-400 shadow-[0_0_35px_rgba(251,191,36,0.6)]">
              <AlertTriangle className="h-5 w-5 text-slate-950" />
            </div>
            <div>
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">Alerts</h2>
              <p className="text-xs text-slate-400 sm:text-sm">
                Live alerts generated from <span className="text-slate-200">stock_items</span> +{" "}
                <span className="text-slate-200">temperature_logs</span>.
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                {authLoading
                  ? "Checking sign-in…"
                  : authUser
                    ? `Signed in as ${resolvedByLabel}${isAdmin ? " • System Admin" : ""}`
                    : "Not signed in"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="rounded-full border-white/10 bg-slate-900/40 text-xs text-slate-200 hover:bg-slate-900/60"
              onClick={() => setSettingsOpen(true)}
            >
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="inline-flex gap-1 rounded-full border border-white/10 bg-slate-900/40 p-1">
          <button
            className={`px-3 py-1.5 rounded-full text-xs ${
              view === "active"
                ? "bg-slate-800/70 text-slate-50"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
            onClick={() => setView("active")}
          >
            Active ({counts.total})
          </button>
          <button
            className={`px-3 py-1.5 rounded-full text-xs ${
              view === "resolved"
                ? "bg-slate-800/70 text-slate-50"
                : "text-slate-300 hover:bg-slate-800/40"
            }`}
            onClick={() => setView("resolved")}
          >
            Resolved ({counts.resolved})
          </button>
        </div>

        {/* Load errors */}
        {(loadError || tempError || settingsError) && (
          <Card className="p-4 border-rose-500/30 bg-rose-500/10 mt-3">
            <div className="space-y-1 text-sm text-rose-100">
              {loadError ? (
                <div>
                  Stock error: <span className="text-rose-50 font-semibold">{loadError}</span>
                </div>
              ) : null}
              {tempError ? (
                <div>
                  Temperature error: <span className="text-rose-50 font-semibold">{tempError}</span>
                </div>
              ) : null}
              {settingsError ? (
                <div>
                  Settings error: <span className="text-rose-50 font-semibold">{settingsError}</span>
                </div>
              ) : null}
            </div>
          </Card>
        )}

        {/* Summary cards */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 mt-3">
          <Card className="p-4 border-rose-500/30 bg-rose-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-rose-500/30">
                <AlertTriangle className="h-4 w-4 text-rose-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-rose-100">Critical</p>
                <p className="text-xl font-semibold text-rose-50">{counts.critical}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-amber-400/30 bg-amber-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/30">
                <Calendar className="h-4 w-4 text-amber-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-amber-100">Warnings</p>
                <p className="text-xl font-semibold text-amber-50">{counts.warn}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 border-emerald-400/30 bg-emerald-500/10">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/30">
                <CheckCircle className="h-4 w-4 text-emerald-50" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-100">Clear</p>
                <p className="text-xl font-semibold text-emerald-50">
                  {counts.total === 0 ? "Yes" : "No"}
                </p>
              </div>
            </div>
          </Card>
        </div>

        <div className="mt-3 text-xs text-slate-400 flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1">
            <Package className="h-3.5 w-3.5" /> Stock alerts:{" "}
            <span className="text-slate-200">{counts.stock}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Thermometer className="h-3.5 w-3.5" /> Temperature alerts:{" "}
            <span className="text-slate-200">{counts.temp}</span>
          </span>
          <span className="inline-flex items-center gap-1">
            <Mail className="h-3.5 w-3.5" /> Email hooks:{" "}
            <span className="text-slate-200">{emailEnabled ? "On" : "Off"}</span>
          </span>
          {settingsLoading ? (
            <span className="inline-flex items-center gap-1 text-slate-500">Loading settings…</span>
          ) : null}
        </div>
      </section>

      {/* Alerts list */}
      <section className="space-y-3">
        {view === "active" && activeAlerts.length === 0 && !loadError && !tempError ? (
          <Card className="p-4 border-emerald-400/30 bg-emerald-500/10">
            <p className="text-sm text-emerald-50">No active alerts 🎉</p>
            <p className="mt-1 text-xs text-emerald-700">
              (Auto-generated from expiry dates, min stock levels, and latest temperature readings.)
            </p>
          </Card>
        ) : null}

        {view === "resolved" && resolvedAlerts.length === 0 ? (
          <Card className="p-4 border-slate-700/30 bg-slate-900/40">
            <p className="text-sm text-slate-200">No resolved alerts yet.</p>
            <p className="mt-1 text-xs text-slate-400">Resolve an alert to move it here.</p>
          </Card>
        ) : null}

        {view === "active" &&
          activeAlerts.map((alert) => (
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
                  {alert.source === "temperature" ? (
                    <Thermometer
                      className={`h-4 w-4 ${
                        alert.severity === "critical" ? "text-rose-100" : "text-amber-100"
                      }`}
                    />
                  ) : alert.type === "expired" || alert.type === "low_stock" ? (
                    <AlertTriangle className="h-4 w-4 text-rose-100" />
                  ) : (
                    <Package className="h-4 w-4 text-amber-100" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-50">{alert.title}</p>
                      <p className="mt-1 text-xs text-slate-100/80">{alert.message}</p>
                      <p className="mt-2 text-[11px] text-slate-300/70">
                        Source: <span className="text-slate-200">{alert.source}</span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="rounded-full border-white/10 bg-slate-900/30 text-xs text-slate-200 hover:bg-slate-900/50"
                      onClick={() => resolveAlert(alert.id)}
                      disabled={!authUser}
                      title={!authUser ? "Sign in to resolve" : "Hide this alert practice-wide"}
                    >
                      Resolve
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}

        {view === "resolved" &&
          resolvedAlerts.map((row) => (
            <Card
              key={row.id}
              className={`p-4 border ${
                row.severity === "critical"
                  ? "border-rose-500/30 bg-rose-500/5"
                  : "border-slate-700/30 bg-slate-900/40"
              }`}
            >
              <div className="flex items-start gap-3 text-sm">
                <div className="mt-0.5">
                  <CheckCircle className="h-4 w-4 text-emerald-200" />
                </div>

                <div className="flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-50">{row.title}</p>
                      <p className="mt-1 text-xs text-slate-100/80">{row.message}</p>
                      <p className="mt-2 text-[11px] text-slate-300/70">
                        Resolved by <span className="text-slate-200">{row.resolved_by}</span>
                        {row.resolved_at ? (
                          <>
                            {" "}
                            • <span className="text-slate-200">{formatDateTime(row.resolved_at)}</span>
                          </>
                        ) : null}
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      className="rounded-full border-rose-400/20 bg-rose-500/10 text-xs text-rose-100 hover:bg-rose-500/15"
                      onClick={() => unresolveAlert(row.id)}
                      disabled={!authUser || !isAdmin}
                      title={!authUser ? "Sign in" : !isAdmin ? "System Admin only" : "Unresolve (admin only)"}
                    >
                      Unresolve
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          ))}
      </section>

      {/* Settings Drawer */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur">
          <div className="w-full max-w-xl rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-lg font-semibold text-slate-50 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-teal-300" />
                  Alert settings
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  These settings are stored <span className="text-slate-200">practice-wide</span> in Firestore (
                  <span className="text-slate-200">settings/alerts</span>).
                  {!isAdmin ? " (View only — admin required to edit.)" : ""}
                </div>
              </div>
              <Button
                variant="outline"
                className="rounded-full border-white/10 bg-slate-900/40 text-xs text-slate-200 hover:bg-slate-900/60"
                onClick={() => setSettingsOpen(false)}
                disabled={savingSettings}
              >
                <X className="h-4 w-4 mr-1.5" />
                Close
              </Button>
            </div>

            <div className="mt-5 space-y-4">
              <Card className="p-4 border-slate-700/40 bg-slate-950/40">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-sm font-semibold text-slate-50">Email hooks (placeholder)</div>
                    <div className="text-xs text-slate-400 mt-1">
                      Turning this on doesn’t send emails yet — it’s the switch we’ll connect to Power Automate / Cloud Functions.
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    disabled={!isAdmin || savingSettings}
                    className={`rounded-full text-xs ${
                      draftEmailEnabled
                        ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-100"
                        : "border-white/10 bg-slate-900/40 text-slate-200"
                    }`}
                    onClick={() => setDraftEmailEnabled((v) => !v)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    {draftEmailEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>
              </Card>

              <Card className="p-4 border-slate-700/40 bg-slate-950/40">
                <div className="text-sm font-semibold text-slate-50">Expiry thresholds</div>
                <div className="text-xs text-slate-400 mt-1">
                  Global threshold applies unless a category override is set above 0.
                </div>

                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-slate-300">Global “expiring soon” days</label>
                    <Input
                      disabled={!isAdmin || savingSettings}
                      value={String(draftGlobalExpirySoonDays)}
                      onChange={(e) =>
                        setDraftGlobalExpirySoonDays(Math.max(0, Number(e.target.value || 0)))
                      }
                      placeholder="e.g. 30"
                    />
                  </div>

                  <div className="text-xs text-slate-400 flex items-end">
                    Tip: set a category to <span className="text-slate-200 font-semibold mx-1">0</span>
                    to disable expiring-soon alerts for that category.
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Object.keys({ ...DEFAULT_CATEGORY_THRESHOLDS, ...draftCategoryThresholds }).map((cat) => (
                    <div key={cat}>
                      <label className="text-xs text-slate-300">{cat} (days)</label>
                      <Input
                        disabled={!isAdmin || savingSettings}
                        value={String(draftCategoryThresholds?.[cat] ?? DEFAULT_CATEGORY_THRESHOLDS[cat] ?? 0)}
                        onChange={(e) => {
                          const n = Math.max(0, Number(e.target.value || 0));
                          setDraftCategoryThresholds((prev) => ({ ...(prev || {}), [cat]: n }));
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    disabled={savingSettings}
                    onClick={() => {
                      // Reset draft to current live values
                      setDraftEmailEnabled(emailEnabled);
                      setDraftGlobalExpirySoonDays(globalExpirySoonDays);
                      setDraftCategoryThresholds(categoryThresholds);
                    }}
                  >
                    Reset
                  </Button>

                  <Button
                    disabled={!isAdmin || savingSettings}
                    onClick={savePracticeSettings}
                    title={!isAdmin ? "System Admin only" : "Save practice-wide settings"}
                  >
                    {savingSettings ? "Saving…" : "Save"}
                  </Button>
                </div>

                {!isAdmin ? (
                  <div className="mt-3 text-xs text-slate-400">
                    You can view settings, but only a <span className="text-slate-200">System Admin</span> can save changes.
                  </div>
                ) : null}
              </Card>

              <Card className="p-4 border-slate-700/40 bg-slate-950/40">
                <div className="text-sm font-semibold text-slate-50">Resolved alerts</div>
                <div className="text-xs text-slate-400 mt-1">
                  Practice-wide. Admin status is read from <span className="text-slate-200">users/{`{uid}`}</span>.
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
