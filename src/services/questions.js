// src/services/questions.js
import { db } from "../api/firebase";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
} from "firebase/firestore";

const DEFAULT_LIMIT = 20;

export async function fetchQuestionsPage({
  pageParam = null,
  limit: pageSize = DEFAULT_LIMIT,
} = {}) {
  const colRef = collection(db, "questions");
  let q = query(colRef, orderBy("createdAt", "desc"), limit(pageSize));

  if (pageParam) {
    q = query(
      colRef,
      orderBy("createdAt", "desc"),
      startAfter(pageParam),
      limit(pageSize)
    );
  }

  const snap = await getDocs(q);
  const docs = snap.docs.map((docSnap) => ({
    id: docSnap.id,
    ...docSnap.data(),
  }));
  const lastDoc = snap.docs[snap.docs.length - 1] || null;

  return {
    items: docs,
    hasMore: snap.docs.length === pageSize,
    nextPage: lastDoc,
  };
}
