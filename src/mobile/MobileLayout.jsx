import { useState } from "react";

import MobileHome from "./MobileHome";
import MobileBottomNav from "./MobileBottomNav";
import MobileBarcodeScanner from "@/components/ui/MobileBarcodeScanner";
import { findStockItemByBarcode } from "@/services/stockService";

export default function MobileLayout() {
  const [scannedItem, setScannedItem] = useState(null);
  const [scanError, setScanError] = useState("");

  const handleMobileScan = async (code) => {
  const scannedCode = String(code || "").trim();

  if (!scannedCode) return;

  setScanError("");
  setScannedItem(null);

  try {
    const item = await findStockItemByBarcode(scannedCode);

    setScannedItem({
      ...item,
      barcode: scannedCode,
    });
  } catch (err) {
    setScanError(err?.message || "Item not found.");
  }
};

  return (
    <div className="min-h-screen bg-slate-950 text-white pb-20">
      <MobileHome />

      {scannedItem && (
        <div className="fixed inset-0 z-[70] flex items-end bg-black/50">
          <div className="w-full rounded-t-3xl border border-teal-400/30 bg-slate-950 p-5 shadow-2xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal-300">
              Item found
            </p>

            <p className="mt-1 text-xl font-bold text-white">
              {scannedItem.name || "Unnamed item"}
            </p>

            <p className="mt-2 text-sm text-slate-300">
              Stock: {scannedItem.current_stock ?? 0}
              {scannedItem.location ? ` • ${scannedItem.location}` : ""}
            </p>

            {scannedItem.barcode && (
              <p className="mt-1 text-xs text-slate-500">
                Barcode: {scannedItem.barcode}
              </p>
            )}

            <div className="mt-5 grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-teal-400 px-3 py-3 text-sm font-bold text-slate-950">
                Use Stock
              </button>

              <button className="rounded-xl border border-slate-700 px-3 py-3 text-sm text-white">
                Receive
              </button>
            </div>

            <button
              type="button"
              onClick={() => setScannedItem(null)}
              className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-3 text-sm text-slate-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {scanError && (
        <div className="fixed inset-x-4 bottom-24 z-[70] rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
          {scanError}
        </div>
      )}

      <MobileBarcodeScanner onScan={handleMobileScan} />

      <MobileBottomNav
        onScanClick={() => {
          document.querySelector("[data-mobile-scan-button]")?.click();
        }}
      />
    </div>
  );
}