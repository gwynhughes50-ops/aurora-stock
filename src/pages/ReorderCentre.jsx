import { useEffect, useState } from "react";
import {
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  updateDoc,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ClipboardList } from "lucide-react";

import { db } from "@/lib/firebase";

export default function ReorderCentre() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionBusyId, setActionBusyId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
const [rejectRequestId, setRejectRequestId] = useState(null);
const [rejectReason, setRejectReason] = useState("");
const [activeTab, setActiveTab] = useState("pending");

  const updateRequestStatus = async (requestId, status) => {
    try {
      setActionBusyId(requestId);

      await updateDoc(doc(db, "reorder_requests", requestId), {
  status,
  updated_at: serverTimestamp(),

  rejection_reason: reason,
  rejected_at: serverTimestamp(),
  rejected_by: currentUser?.displayName || currentUser?.email,
});
    } catch (err) {
      console.error(err);
      alert("Failed to update reorder request");
    } finally {
      setActionBusyId(null);
    }
  };

  const approveRequest = (requestId) => {
    updateRequestStatus(requestId, "approved");
  };

  const rejectRequest = (requestId) => {
    updateRequestStatus(requestId, "rejected");
  };

  useEffect(() => {
    const qRequests = query(
        collection(db, "reorder_requests"),
  limit(100)
);

    const unsub = onSnapshot(
      qRequests,
      (snap) => {
        const rows = snap.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log("REORDER REQUESTS:", rows);

        setRequests(rows);
        setLoading(false);
      },
      (err) => {
        console.error("REORDER REQUEST QUERY FAILED:", err);
        alert(err.message);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const submitRejectRequest = async () => {
  if (!rejectRequestId) return;

  if (!rejectReason.trim()) {
    alert("Please enter a rejection reason");
    return;
  }

  try {
    setActionBusyId(rejectRequestId);

    await updateDoc(doc(db, "reorder_requests", rejectRequestId), {
      status: "rejected",
      rejection_reason: rejectReason.trim(),
      rejected_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    setShowRejectModal(false);
    setRejectRequestId(null);
    setRejectReason("");
  } catch (err) {
    console.error(err);
    alert("Failed to reject reorder request");
  } finally {
    setActionBusyId(null);
  }
};
const filteredRequests = requests.filter((request) => {
  return (request.status || "pending") === activeTab;
});
  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
        {showRejectModal && (
  <div className="fixed inset-0 z-[80] flex items-end bg-black/60">
    <div className="w-full rounded-t-3xl border border-rose-500/30 bg-slate-950 p-5 shadow-2xl">
      <h2 className="text-xl font-bold text-white">Reject Request</h2>

      <p className="mt-1 text-sm text-slate-400">
        Please provide a reason for rejecting this reorder request.
      </p>

      <textarea
        value={rejectReason}
        onChange={(e) => setRejectReason(e.target.value)}
        rows={4}
        placeholder="Reason for rejection..."
        className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-3 text-white"
      />

      <button
        type="button"
        onClick={submitRejectRequest}
        disabled={actionBusyId === rejectRequestId}
        className="mt-4 w-full rounded-xl bg-rose-500 px-3 py-3 font-semibold text-white disabled:opacity-50"
      >
        {actionBusyId === rejectRequestId ? "Rejecting..." : "Reject Request"}
      </button>

      <button
        type="button"
        onClick={() => {
          setShowRejectModal(false);
          setRejectRequestId(null);
          setRejectReason("");
        }}
        className="mt-3 w-full rounded-xl bg-slate-800 px-3 py-3 text-white"
      >
        Cancel
      </button>
    </div>
  </div>
)}
      <div className="mb-6 flex items-center gap-3">
        <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-300">
          <ClipboardList className="h-6 w-6" />
        </div>

        <div>
          <h1 className="text-2xl font-bold">Reorder Centre</h1>
          <p className="text-sm text-slate-400">
            Review and manage stock reorder requests
          </p>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2">
  {[
    "pending",
    "approved",
    "rejected",
    "ordered",
    "completed",
  ].map((tab) => (
    <button
      key={tab}
      type="button"
      onClick={() => setActiveTab(tab)}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        activeTab === tab
          ? "bg-teal-400 text-slate-950"
          : "bg-slate-800 text-slate-300 hover:bg-slate-700"
      }`}
    >
      {tab.charAt(0).toUpperCase() + tab.slice(1)}
    </button>
  ))}
</div>
      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-white">
  {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Requests
</h2>

          <span className="rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-slate-950">
            {loading ? "—" : filteredRequests.length}
          </span>
        </div>

        {loading ? (
          <p className="text-sm text-slate-400">Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="text-sm text-slate-400">
            No {activeTab} reorder requests.
          </p>
        ) : (
          <div className="space-y-3">
            {filteredRequests.map((req) => (
              <div
                key={req.id}
                className="rounded-xl border border-slate-800 bg-slate-950 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-white">
                      {req.item_name || "Unnamed item"}
                    </h3>

                    <p className="mt-1 text-sm text-slate-400">
                      {req.site || "No site"}
                      {req.location ? ` • ${req.location}` : ""}
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-500/10 px-2 py-1 text-xs font-semibold text-amber-300">
                    {req.status || "pending"}
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                  <div className="rounded-lg bg-slate-900 p-2">
                    <div className="text-slate-500">Current</div>
                    <div className="font-bold text-white">
                      {req.current_stock ?? 0}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-2">
                    <div className="text-slate-500">Minimum</div>
                    <div className="font-bold text-white">
                      {req.min_stock ?? 0}
                    </div>
                  </div>

                  <div className="rounded-lg bg-slate-900 p-2">
                    <div className="text-slate-500">Requested</div>
                    <div className="font-bold text-white">
                      {req.requested_qty ?? 1}
                    </div>
                  </div>
                </div>

                {req.note && (
                  <div className="mt-3 rounded-lg border border-slate-800 bg-slate-900 p-3 text-sm text-slate-300">
                    {req.note}
                  </div>
                )}

                <div className="mt-4 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => approveRequest(req.id)}
                    disabled={actionBusyId === req.id}
                    className="rounded-xl bg-emerald-400 px-3 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"
                  >
                    {actionBusyId === req.id ? "Working..." : "Approve"}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
  setRejectRequestId(req.id);
  setRejectReason("");
  setShowRejectModal(true);
}}
                    disabled={actionBusyId === req.id}
                    className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-sm font-semibold text-rose-200 disabled:opacity-50"
                  >
                    {actionBusyId === req.id ? "Working..." : "Reject"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}