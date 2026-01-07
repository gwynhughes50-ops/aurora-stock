// src/services/stockService.js
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../lib/firebase";

const ITEMS_COL = "stock_items";
const MOVES_COL = "stock_movements";

function toNumber(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
}

function cleanString(v) {
  return String(v ?? "").trim();
}

function normalizeItemPatch(patch = {}) {
  const out = { ...patch, updated_at: serverTimestamp() };

  if ("current_stock" in out) out.current_stock = toNumber(out.current_stock, 0);
  if ("min_stock" in out) out.min_stock = toNumber(out.min_stock, 0);
  if ("max_stock" in out) out.max_stock = toNumber(out.max_stock, 0);

  if ("name" in out) out.name = cleanString(out.name);
  if ("barcode" in out) out.barcode = cleanString(out.barcode);
  if ("site" in out) out.site = cleanString(out.site);
  if ("location" in out) out.location = cleanString(out.location);
  if ("batch_number" in out) out.batch_number = cleanString(out.batch_number);
  if ("photo_url" in out) out.photo_url = cleanString(out.photo_url);
  if ("unit" in out) out.unit = cleanString(out.unit);
  if ("expiry_date" in out) out.expiry_date = cleanString(out.expiry_date);

  return out;
}

/**
 * Realtime subscription for items
 * includeArchived=false => active only
 */
export function subscribeToStock(onData, onError, { includeArchived = false } = {}) {
  const base = collection(db, ITEMS_COL);

  const q = includeArchived
    ? query(base, orderBy("updated_at", "desc"))
    : query(base, where("archived_at", "==", null), orderBy("updated_at", "desc"));

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function createStockItem(data) {
  const payload = normalizeItemPatch({
    name: cleanString(data?.name),
    barcode: cleanString(data?.barcode),
    category: data?.category || "non_medical",
    site: cleanString(data?.site),
    location: cleanString(data?.location),
    batch_number: cleanString(data?.batch_number),
    expiry_date: cleanString(data?.expiry_date),

    current_stock: toNumber(data?.current_stock, 0),
    min_stock: toNumber(data?.min_stock, 0),
    max_stock: toNumber(data?.max_stock, 0),

    unit: cleanString(data?.unit),
    photo_url: cleanString(data?.photo_url),

    archived_at: null,
    archived_by: null,

    created_at: serverTimestamp(),
  });

  const ref = await addDoc(collection(db, ITEMS_COL), payload);

  // ✅ movement log: create (now includes item_name)
  await addDoc(collection(db, MOVES_COL), {
    item_id: ref.id,
    item_name: payload.name || "",
    type: "create",
    delta: 0,
    qty_before: null,
    qty_after: payload.current_stock ?? 0,
    reason: null,
    notes: null,
    actor: null,
    created_at: serverTimestamp(),
  });

  return ref.id;
}

export async function updateStockItem(id, patch) {
  const ref = doc(db, ITEMS_COL, id);

  // Read current name so the edit audit row always has it
  let item_name = "";
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) item_name = snap.data()?.name || "";
  } catch {
    // ignore
  }

  await updateDoc(ref, normalizeItemPatch(patch));

  // ✅ movement log: edit (now includes item_name)
  await addDoc(collection(db, MOVES_COL), {
    item_id: id,
    item_name,
    type: "edit",
    delta: 0,
    qty_before: null,
    qty_after: null,
    reason: null,
    notes: null,
    actor: null,
    created_at: serverTimestamp(),
  });
}

/**
 * ✅ Archive instead of delete
 */
export async function archiveStockItem(id, actor = null) {
  const ref = doc(db, ITEMS_COL, id);

  // Read name for audit row
  let item_name = "";
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) item_name = snap.data()?.name || "";
  } catch {
    // ignore
  }

  await updateDoc(ref, {
    archived_at: serverTimestamp(),
    archived_by: actor || null,
    updated_at: serverTimestamp(),
  });

  // ✅ movement log: archive (now includes item_name)
  await addDoc(collection(db, MOVES_COL), {
    item_id: id,
    item_name,
    type: "archive",
    delta: 0,
    qty_before: null,
    qty_after: null,
    reason: null,
    notes: null,
    actor: actor || null,
    created_at: serverTimestamp(),
  });
}

export async function restoreStockItem(id, actor = null) {
  const ref = doc(db, ITEMS_COL, id);

  // Read name for audit row
  let item_name = "";
  try {
    const snap = await getDoc(ref);
    if (snap.exists()) item_name = snap.data()?.name || "";
  } catch {
    // ignore
  }

  await updateDoc(ref, {
    archived_at: null,
    archived_by: null,
    updated_at: serverTimestamp(),
  });

  // ✅ movement log: unarchive (now includes item_name)
  await addDoc(collection(db, MOVES_COL), {
    item_id: id,
    item_name,
    type: "unarchive",
    delta: 0,
    qty_before: null,
    qty_after: null,
    reason: null,
    notes: null,
    actor: actor || null,
    created_at: serverTimestamp(),
  });
}

/**
 * ✅ Stock movement transaction (receive/use/adjust)
 */
export async function applyStockMovement(itemId, movement) {
  const type = movement?.type;
  if (!["use", "receive", "adjust"].includes(type)) {
    throw new Error("Invalid movement type");
  }

  const itemRef = doc(db, ITEMS_COL, itemId);

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(itemRef);
    if (!snap.exists()) throw new Error("Item not found");

    const item = snap.data();
    const item_name = item?.name || ""; // ✅ snapshot name for audit
    const before = toNumber(item.current_stock, 0);

    let after = before;
    let delta = 0;

    if (type === "receive") {
      const qty = Math.abs(toNumber(movement.qty, 0));
      if (qty <= 0) throw new Error("Quantity must be > 0");
      delta = qty;
      after = before + qty;
    }

    if (type === "use") {
      const qty = Math.abs(toNumber(movement.qty, 0));
      if (qty <= 0) throw new Error("Quantity must be > 0");
      if (qty > before) throw new Error("Not enough stock");
      delta = -qty;
      after = before - qty;
    }

    if (type === "adjust") {
      const setTo = toNumber(movement.set_to, NaN);
      if (!Number.isFinite(setTo) || setTo < 0) throw new Error("set_to must be >= 0");
      after = setTo;
      delta = after - before;
    }

    const reason = movement?.reason || null;
    const notes = movement?.notes || null;
    const actor = movement?.actor || null;

    tx.update(itemRef, {
      current_stock: after,
      updated_at: serverTimestamp(),
      last_movement: {
        type,
        delta,
        qty_before: before,
        qty_after: after,
        reason,
        notes,
        actor,
      },
    });

    const moveRef = doc(collection(db, MOVES_COL));
    tx.set(moveRef, {
      item_id: itemId,
      item_name, // ✅ added
      type,
      delta,
      qty_before: before,
      qty_after: after,
      reason,
      notes,
      actor,
      created_at: serverTimestamp(),
    });

    return { before, after, delta };
  });
}

/**
 * ✅ History (audit trail)
 */
export function subscribeToMovements(itemId, onData, onError, max = 200) {
  const q = query(
    collection(db, MOVES_COL),
    where("item_id", "==", itemId),
    orderBy("created_at", "desc"),
    limit(max)
  );

  return onSnapshot(
    q,
    (snap) => onData(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    onError
  );
}

export async function fetchMovements(itemId, max = 50) {
  const q = query(
    collection(db, MOVES_COL),
    where("item_id", "==", itemId),
    orderBy("created_at", "desc"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
/**
 * ✅ Ultra-fast barcode-driven "USE STOCK" helper
 * Used by Dashboard quick action
 */
export async function useStockQuick({ barcode, qty, actor = null }) {
  const code = String(barcode || "").trim();
  const n = Number(qty);

  if (!code) throw new Error("Barcode missing.");
  if (!Number.isFinite(n) || n <= 0) throw new Error("Invalid quantity.");

  // 1️⃣ Find item by barcode
  const q = query(
    collection(db, ITEMS_COL),
    where("barcode", "==", code),
    limit(1)
  );

  const snap = await getDocs(q);

  if (snap.empty) {
    throw new Error("Item not found for this barcode.");
  }

  const docSnap = snap.docs[0];

  // 2️⃣ Delegate to the existing transaction engine
  await applyStockMovement(docSnap.id, {
    type: "use",
    qty: n,
    actor,
  });

  return true;
}

 // Add near the bottom of src/services/stockService.js

export async function useStockByBarcode({ barcode, qty, actor = null }) {
  const code = String(barcode || "").trim();
  const n = Number(qty);

  if (!code) throw new Error("Barcode missing.");
  if (!Number.isFinite(n) || n <= 0) throw new Error("Quantity must be at least 1.");

  const q = query(
    collection(db, ITEMS_COL),
    where("barcode", "==", code),
    limit(1)
  );

  const snap = await getDocs(q);
  if (snap.empty) throw new Error("Item not found for this barcode.");

  const itemId = snap.docs[0].id;

  // Reuse your existing transaction + audit trail
  await applyStockMovement(itemId, {
    type: "use",
    qty: n,
    actor,
  });

  return true;
}
 
  