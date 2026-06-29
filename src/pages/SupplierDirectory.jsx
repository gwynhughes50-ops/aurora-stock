import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  onSnapshot,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { Building2 } from "lucide-react";

import { db } from "@/lib/firebase";

export default function SupplierDirectory() {
  const [suppliers, setSuppliers] = useState([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");

  useEffect(() => {
    const qSuppliers = query(collection(db, "suppliers"));

    const unsub = onSnapshot(qSuppliers, (snap) => {
      const rows = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setSuppliers(rows);
    });

    return () => unsub();
  }, []);

  const addSupplier = async () => {
    if (!name.trim()) {
      alert("Supplier name required");
      return;
    }

    await addDoc(collection(db, "suppliers"), {
      name: name.trim(),
      email: email.trim(),
      website: website.trim(),
      created_at: serverTimestamp(),
      active: true,
    });

    setName("");
    setEmail("");
    setWebsite("");
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-cyan-500/10 p-3 text-cyan-300">
          <Building2 className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Suppliers</h1>
          <p className="text-sm text-slate-400">
            Manage supplier details for purchasing and reordering
          </p>
        </div>
      </div>

      <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-4 font-semibold text-white">Add Supplier</h2>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Supplier name"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />

          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />

          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="Website"
            className="rounded-xl border border-slate-700 bg-slate-950 px-3 py-3 text-white"
          />
        </div>

        <button
          type="button"
          onClick={addSupplier}
          className="mt-4 rounded-xl bg-cyan-400 px-4 py-2 font-bold text-slate-950"
        >
          Add Supplier
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="mb-4 font-semibold text-white">
          Supplier Directory
        </h2>

        {suppliers.length === 0 ? (
          <p className="text-sm text-slate-400">No suppliers yet.</p>
        ) : (
          <div className="space-y-3">
            {suppliers.map((supplier) => (
              <div
                key={supplier.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="font-bold text-white">
                  {supplier.name}
                </div>

                <div className="mt-1 text-sm text-slate-400">
                  {supplier.email || "No email"}
                  {supplier.website ? ` • ${supplier.website}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}