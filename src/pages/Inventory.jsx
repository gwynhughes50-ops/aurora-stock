import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import MobileBarcodeScanner from "@/components/ui/MobileBarcodeScanner";
import PhotoCapture from "@/components/ui/PhotoCapture";

import StockMovementDialog from "@/components/stock/StockMovementDialog";
import StockHistoryDialog from "@/components/stock/StockHistoryDialog";
import ManualAddItemDialog from "@/components/stock/ManualAddItemDialog";

import useStock from "@/hooks/useStock";
import { getRole, canArchive, canEdit, canMoveStock } from "@/auth/permissions";
import { auth } from "@/lib/firebase";

import {
  Search,
  Package,
  Tag,
  Pencil,
  History,
  Trash2,
  Archive,
  RotateCcw,
} from "lucide-react";

/* helpers */
const getStockBadge = (qty, min) =>
  qty <= min
    ? "bg-rose-500/20 text-rose-300"
    : "bg-emerald-500/20 text-emerald-300";

export default function Inventory() {
  /* auth */
  const user = auth.currentUser;
  const role = getRole(user);

  /* state */
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState("");

  const [moveOpen, setMoveOpen] = useState(false);
  const [moveMode, setMoveMode] = useState("use");
  const [activeItem, setActiveItem] = useState(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);

  const [manualAddOpen, setManualAddOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteItem, setDeleteItem] = useState(null);

  /* stock hook */
  const {
    items,
    loading,
    error,
    archiveItem,
    restoreItem,
    receiveStock,
    useStockQty,
    addItem,
    updateItem,
  } = useStock({ includeArchived: showArchived });

  /* handlers */
  const openDelete = (item) => {
    if (!canArchive(role)) return;
    setDeleteItem(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteItem) return;
    await archiveItem(deleteItem.id, user);
    setDeleteOpen(false);
    setDeleteItem(null);
  };

  const openUse = (item) => {
    setActiveItem(item);
    setMoveMode("use");
    setMoveOpen(true);
  };

  const openReceive = (item) => {
    setActiveItem(item);
    setMoveMode("receive");
    setMoveOpen(true);
  };

  const filtered = items.filter((it) =>
    it.name?.toLowerCase().includes(search.toLowerCase())
  );

  /* render */
  return (
    <div className="space-y-5">
      {/* Sticky top bar */}
      <div className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur p-3 rounded-2xl border border-slate-800/60">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search inventory…"
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Button variant="ghost" onClick={() => setShowArchived((v) => !v)}>
            {showArchived ? "Hide archived" : "Show archived"}
          </Button>

          <Button onClick={() => setManualAddOpen(true)}>Add item</Button>

          <MobileBarcodeScanner />
        </div>
      </div>

      {loading && <p className="text-slate-400">Loading inventory…</p>}
      {error && <p className="text-rose-400">{String(error)}</p>}

      {/* Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const archived = Boolean(item.archived_at);

          return (
            <Card
              key={item.id}
              className={`p-4 rounded-2xl border ${
                archived
                  ? "bg-slate-900/40 text-slate-400"
                  : "bg-slate-900/90 text-slate-100"
              }`}
            >
              <div className="flex justify-between gap-3">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  {item.barcode && (
                    <p className="text-xs text-slate-400">{item.barcode}</p>
                  )}
                </div>

                <span
                  className={`px-2 py-0.5 text-xs rounded-full ${getStockBadge(
                    item.current_stock,
                    item.min_stock
                  )}`}
                >
                  {item.current_stock}
                </span>
              </div>

              {!archived && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => openUse(item)}
                    disabled={!canMoveStock(role)}
                  >
                    − Use
                  </Button>
                  <Button
                    onClick={() => openReceive(item)}
                    disabled={!canMoveStock(role)}
                  >
                    + Receive
                  </Button>
                </div>
              )}

              <div className="mt-3 flex justify-between items-center">
                <PhotoCapture
                  buttonLabel="Photo"
                  onCapture={(img) =>
                    updateItem(item.id, { photo_url: img })
                  }
                />

                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => openDelete(item)}
                    disabled={!canArchive(role)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>

                  {!archived ? (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => archiveItem(item.id, user)}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => restoreItem(item.id, user)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>

              {archived && (
                <div className="mt-3 text-xs text-slate-500">Archived</div>
              )}
            </Card>
          );
        })}
      </div>

      {/* dialogs */}
      <StockMovementDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        item={activeItem}
        mode={moveMode}
        onConfirm={async ({ qty }) => {
          if (!activeItem) return;
          if (moveMode === "receive") {
            await receiveStock(activeItem.id, qty, { actor: user });
          } else {
            await useStockQty(activeItem.id, qty, { actor: user });
          }
        }}
      />

      <StockHistoryDialog
        open={historyOpen}
        onOpenChange={setHistoryOpen}
        item={historyItem}
      />

      <ManualAddItemDialog
        open={manualAddOpen}
        onOpenChange={setManualAddOpen}
        onCreate={addItem}
      />

      {/* Delete confirm */}
      {deleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-slate-900 p-4 rounded-2xl max-w-sm w-full">
            <p className="font-semibold text-rose-300">Archive item?</p>
            <p className="text-sm text-slate-400 mt-1">
              You are about to archive{" "}
              <strong>{deleteItem?.name}</strong>.
            </p>

            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setDeleteOpen(false)}>
                Cancel
              </Button>
              <Button className="bg-rose-500" onClick={confirmDelete}>
                Yes, archive
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
