// services/articles.js
import { db } from "../api/firebase";
import { doc, getDoc } from "firebase/firestore";
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  startAfter,
} from "firebase/firestore";

const PAGE = 6;

export async function fetchArticles({ pageParam = null }) {
  const ref = collection(db, "posts");
  let q = query(ref, orderBy("createdAt", "desc"), limit(PAGE));
  if (pageParam) {
    q = query(
      ref,
      orderBy("createdAt", "desc"),
      startAfter(pageParam),
      limit(PAGE)
    );
  }
  const snap = await getDocs(q);
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const last = snap.docs[snap.docs.length - 1] || null;
  return {
    items: docs,
    nextPage: last,
    hasMore: snap.docs.length === PAGE,
  };
}

export async function fetchArticle(id) {
  const snap = await getDoc(doc(db, "posts", id));
  if (!snap.exists()) {
    throw new Error("Article not found");
  }
  return { id: snap.id, ...snap.data() };
}
