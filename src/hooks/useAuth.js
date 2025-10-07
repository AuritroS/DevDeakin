import { useEffect, useMemo, startTransition } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getAuth,
  onAuthStateChanged,
  signOut as fbSignOut,
} from "firebase/auth";
import { getFirestore, doc, getDoc, onSnapshot } from "firebase/firestore";

/** Resolve once with the first Firebase auth state (user or null). */
function waitForFirstAuthState() {
  const auth = getAuth();
  return new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(
      auth,
      (u) => {
        unsub();
        resolve(u ?? null);
      },
      (err) => {
        unsub();
        reject(err);
      }
    );
  });
}

/** Read premium from Firestore: users/{uid}.premium (safe for missing uid). */
async function fetchPremiumFor(uid) {
  if (!uid) return false; // ✅ hard guard: never call doc() with null
  const db = getFirestore();
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? Boolean(snap.data()?.premium) : false;
}

export default function useAuth() {
  const qc = useQueryClient();

  // 1) Fetch the first auth state (Firebase current user)
  const {
    data: user,
    isInitialLoading: userInitialLoading,
    isFetching: userFetching,
  } = useQuery({
    queryKey: ["auth", "user"],
    queryFn: waitForFirstAuthState,
    suspense: false,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: false,
  });

  // 2) Keep "auth/user" cache synced while the app is open
  useEffect(() => {
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => {
      startTransition(() => {
        qc.setQueryData(["auth", "user"], u ?? null);
        if (!u) qc.removeQueries({ queryKey: ["auth", "premium"] });
      });
    });
    return unsub;
  }, [qc]);

  // 3) Premium flag — only fetch when uid exists; derive uid from queryKey
  const uid = user?.uid ?? null;
  const {
    data: premiumData,
    isInitialLoading: premiumInitialLoading,
    isFetching: premiumFetching,
  } = useQuery({
    queryKey: ["auth", "premium", uid],
    queryFn: ({ queryKey }) => fetchPremiumFor(queryKey[2]),
    enabled: !!uid, // ✅ gate execution
    suspense: false,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    retry: 1,
  });
  const premium = premiumData ?? false;

  // 4) Live premium updates (safe-guarded)
  useEffect(() => {
    if (!uid) return; // ✅ don’t open a snapshot without a uid
    const db = getFirestore();
    const ref = doc(db, "users", uid);
    const unsub = onSnapshot(ref, (snap) => {
      const val = snap.exists() ? Boolean(snap.data()?.premium) : false;
      startTransition(() => {
        qc.setQueryData(["auth", "premium", uid], val);
      });
    });
    return unsub;
  }, [qc, uid]);

  // 5) Logout: update caches inside a transition to avoid sync-suspend warning
  const signOut = useMemo(
    () => async () => {
      await fbSignOut(getAuth());
      startTransition(() => {
        qc.setQueryData(["auth", "user"], null); // explicit null (no re-suspend loop)
        qc.removeQueries({ queryKey: ["auth", "premium"] }); // clear premium cache
      });
    },
    [qc]
  );

  const loadingUser = userInitialLoading || userFetching;
  const loadingPremium = uid ? premiumInitialLoading || premiumFetching : false;

  return {
    user: user ?? null,
    premium,
    signOut,
    loading: loadingUser || loadingPremium,
  };
}
