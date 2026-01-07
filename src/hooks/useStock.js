import { useEffect, useMemo, useState } from "react";
import {
  subscribeToStock,

  // archive/restore
  archiveStockItem as archiveItem,
  restoreStockItem as restoreItem,

  // ✅ these DO exist in stockService.js
  createStockItem,
  updateStockItem,
  applyStockMovement,
} from "../services/stockService";

function useStockImpl(options = {}) {
  const { includeArchived = false, initialQuery = "" } = options;

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [queryText, setQueryText] = useState(initialQuery);

  // ✅ actions MUST be defined outside useEffect so they're in scope for return
  const archive = async (id, user = null) => {
    return archiveItem(id, user);
  };

  const restore = async (id, user = null) => {
    return restoreItem(id, user);
  };

  // ✅ create item
  const addItem = async (payload, meta = {}) => {
    // createStockItem currently ignores meta (fine)
    return createStockItem(payload);
  };

  // ✅ update item fields (site/location/name etc)
  const updateItem = async (id, updates, meta = {}) => {
    // updateStockItem currently ignores meta (fine)
    return updateStockItem(id, updates);
  };

  // ✅ stock movements (Use / Receive)
  const receiveStock = async (id, qty, meta = {}) => {
    return applyStockMovement(id, {
      type: "receive",
      qty,
      actor: meta?.actor || null,
    });
  };

  const useStockQty = async (id, qty, meta = {}) => {
    return applyStockMovement(id, {
      type: "use",
      qty,
      actor: meta?.actor || null,
    });
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToStock(
      (rows) => {
        setItems(Array.isArray(rows) ? rows : []);
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      },
      { includeArchived }
    );

    return () => {
      try {
        unsubscribe?.();
      } catch {
        // ignore
      }
    };
  }, [includeArchived]);

  const filtered = useMemo(() => {
    const q = String(queryText || "").trim().toLowerCase();
    if (!q) return items;

    return items.filter((it) => {
      const name = String(it?.name || "").toLowerCase();
      const barcode = String(it?.barcode || "").toLowerCase();
      const category = String(it?.category || "").toLowerCase();
      const site = String(it?.site || "").toLowerCase();
      const location = String(it?.location || "").toLowerCase();
      const batch = String(it?.batch_number || "").toLowerCase();

      return (
        name.includes(q) ||
        barcode.includes(q) ||
        category.includes(q) ||
        site.includes(q) ||
        location.includes(q) ||
        batch.includes(q)
      );
    });
  }, [items, queryText]);

  return {
    items: filtered,
    allItems: items,
    loading,
    error,
    query: queryText,
    setQuery: setQueryText,

    // actions exposed to Inventory.jsx
    archiveItem: archive,
    restoreItem: restore,

    addItem,
    updateItem,
    receiveStock,
    useStockQty,
  };
}

export default function useStock(options = {}) {
  return useStockImpl(options);
}

export function useStockNamed(options = {}) {
  return useStockImpl(options);
}

