import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import { auth, db } from "../lib/firebase";

export default function Register() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const inviteId = params.get("invite");

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState(null);
  const [error, setError] = useState("");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  // -----------------------------
  // Load invite
  // -----------------------------
  useEffect(() => {
    let active = true;

    async function loadInvite() {
      try {
        if (!inviteId) {
          throw new Error("Invalid or missing invite link.");
        }

        const ref = doc(db, "invites", inviteId);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          throw new Error("Invite not found.");
        }

        const data = snap.data();

        if (data.used) {
          throw new Error("This invite has already been used.");
        }

        if (data.expiresAt?.toDate && data.expiresAt.toDate() < new Date()) {
          throw new Error("This invite has expired.");
        }

        // Hard-lock roles
        const role = data.role === "ReadOnly" ? "ReadOnly" : "User";

        if (active) {
          setInvite({
            id: snap.id,
            email: data.email,
            displayName: data.displayName || "",
            role,
          });
        }
      } catch (e) {
        if (active) setError(e.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadInvite();
    return () => {
      active = false;
    };
  }, [inviteId]);

  // -----------------------------
  // Create account
  // -----------------------------
  async function handleRegister() {
    setError("");

    if (!invite?.email) {
      return setError("Invite email missing.");
    }

    if (password.length < 10) {
      return setError("Password must be at least 10 characters.");
    }

    if (password !== confirm) {
      return setError("Passwords do not match.");
    }

    setSaving(true);

    try {
      // Ensure clean auth state
      if (auth.currentUser) {
        await signOut(auth);
      }

      // 1) Create Auth user
      const cred = await createUserWithEmailAndPassword(
        auth,
        invite.email,
        password
      );

      // 2) Create Firestore profile
      await setDoc(doc(db, "users", cred.user.uid), {
        email: invite.email,
        displayName: invite.displayName || invite.email,
        role: invite.role, // User / ReadOnly only
        createdAt: serverTimestamp(),
      });

      // 3) Mark invite used
      await updateDoc(doc(db, "invites", invite.id), {
        used: true,
        usedAt: serverTimestamp(),
        usedByUid: cred.user.uid,
      });

      navigate("/dashboard", { replace: true });
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // -----------------------------
  // UI
  // -----------------------------
  if (loading) {
    return (
      <div style={{ padding: 32, color: "white" }}>
        Loading invite…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 32, color: "white" }}>
        <p style={{ color: "salmon" }}>{error}</p>
        <button onClick={() => navigate("/login")}>
          Back to login
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 32, color: "white", maxWidth: 420 }}>
      <h2>Create account</h2>

      <p><strong>Email:</strong> {invite.email}</p>
      <p><strong>Role:</strong> {invite.role}</p>

      <div style={{ marginTop: 16 }}>
        <input
          type="password"
          placeholder="Password (min 10 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%", marginBottom: 8 }}
        />
        <input
          type="password"
          placeholder="Confirm password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          style={{ width: "100%", marginBottom: 12 }}
        />

        <button onClick={handleRegister} disabled={saving}>
          {saving ? "Creating…" : "Create account"}
        </button>
      </div>
    </div>
  );
}
