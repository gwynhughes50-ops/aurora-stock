import React, { useEffect, useState } from "react";
import { X, Save } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export default function ManualAddItemDialog({ open, onOpenChange, onCreate }) {
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    category: "non_medical",
    site: "",
    location: "",
    batch_number: "",
    expiry_date: "",
    current_stock: 0,
    min_stock: 1,
    max_stock: 10,
    unit: "",
  });

  useEffect(() => {
    if (open) {
      setForm({
        name: "",
        barcode: "",
        category: "non_medical",
        site: "",
        location: "",
        batch_number: "",
        expiry_date: "",
        current_stock: 0,
        min_stock: 1,
        max_stock: 10,
        unit: "",
      });
    }
  }, [open]);

  if (!open) return null;

  const canSave = form.name.trim().length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur">
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 shadow-2xl text-slate-100">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold">Add item</p>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-slate-200 hover:bg-slate-700"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="text-xs text-slate-400">Name *</label>
            <Input className="mt-1" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Barcode</label>
            <Input className="mt-1" value={form.barcode} onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Category</label>
            <select
              className="mt-1 h-10 w-full rounded-xl border border-slate-700/70 bg-slate-900 px-3 text-sm"
              value={form.category}
              onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
            >
              <option value="non_medical">Non-medical</option>
              <option value="medicinal">Medicinal</option>
              <option value="vaccines">Vaccines</option>
              <option value="emergency_drugs">Emergency drugs</option>
              <option value="dressings">Dressings</option>
              <option value="equipment">Equipment</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-slate-400">Site</label>
            <Input className="mt-1" value={form.site} onChange={(e) => setForm((p) => ({ ...p, site: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Location</label>
            <Input className="mt-1" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Batch number</label>
            <Input className="mt-1" value={form.batch_number} onChange={(e) => setForm((p) => ({ ...p, batch_number: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Expiry date</label>
            <Input className="mt-1" type="date" value={form.expiry_date} onChange={(e) => setForm((p) => ({ ...p, expiry_date: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Current stock</label>
            <Input className="mt-1" type="number" value={form.current_stock} onChange={(e) => setForm((p) => ({ ...p, current_stock: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Min stock</label>
            <Input className="mt-1" type="number" value={form.min_stock} onChange={(e) => setForm((p) => ({ ...p, min_stock: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Max stock</label>
            <Input className="mt-1" type="number" value={form.max_stock} onChange={(e) => setForm((p) => ({ ...p, max_stock: e.target.value }))} />
          </div>

          <div>
            <label className="text-xs text-slate-400">Unit</label>
            <Input className="mt-1" value={form.unit} onChange={(e) => setForm((p) => ({ ...p, unit: e.target.value }))} />
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            className="gap-2"
            disabled={!canSave}
            onClick={async () => {
              if (!canSave) return;
              await onCreate({
                ...form,
                current_stock: Number(form.current_stock || 0),
                min_stock: Number(form.min_stock || 0),
                max_stock: Number(form.max_stock || 0),
              });
              onOpenChange(false);
            }}
          >
            <Save className="h-4 w-4" />
            Create
          </Button>
        </div>
      </div>
    </div>
  );
}
