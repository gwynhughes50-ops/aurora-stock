import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// We store:
// - firebaseUser: Firebase Auth user (or null)
// - profile: Firestore user doc (or null)
// - role: derived from profile.role
// - loading: while we figure out who you are + your role
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      try {
        // User profiles live in: users/{uid}
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfile({ id: snap.id, ...snap.data() });
        } else {
          // No profile yet: leave null (rules will enforce safe defaults on creation elsewhere)
          setProfile(null);
        }
      } catch (e) {
        console.error("AuthContext: failed to load user profile", e);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  const role = profile?.role || "User";
  const isAdmin = role === "System Admin";

  const value = useMemo(
    () => ({
      firebaseUser,
      profile,
      role,
      isAdmin,
      loading,
    }),
    [firebaseUser, profile, role, isAdmin, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
