// src/services/banner.js
import { storage } from "../api/firebase";
import { ref, listAll, getMetadata, getDownloadURL } from "firebase/storage";

export async function fetchHeroBanner() {
  const folderRef = ref(storage, "hero-banner");
  const { items } = await listAll(folderRef);
  if (items.length === 0) return null;

  const metas = await Promise.all(items.map((it) => getMetadata(it)));
  const newestIdx = metas.reduce((best, m, i, arr) => {
    const bestTime = new Date(arr[best].updated).getTime();
    const curTime = new Date(m.updated).getTime();
    return curTime > bestTime ? i : best;
  }, 0);

  const newestRef = items[newestIdx];
  return await getDownloadURL(newestRef);
}
