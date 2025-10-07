// src/services/home.js
import { db } from "../api/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";

export async function fetchRecentPosts(n = 6) {
  const q = query(
    collection(db, "posts"),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchRecentQuestions(n = 3) {
  const q = query(
    collection(db, "questions"),
    orderBy("createdAt", "desc"),
    limit(n)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
