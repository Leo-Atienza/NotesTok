import {
  collection,
  query,
  where,
  limit,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { getDB, isFirebaseConfigured } from "./firebase";

const COLLECTION = "voiceover_cache";

/** Simple string hash for cache key (not crypto — just consistent dedup) */
function hashText(text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  // Convert to positive hex string
  return (hash >>> 0).toString(16).padStart(8, "0");
}

export async function getCachedVoiceover(
  text: string,
  voiceId: string
): Promise<string | null> {
  if (!isFirebaseConfigured()) return null;

  const textHash = hashText(text);

  try {
    const db = getDB();
    const q = query(
      collection(db, COLLECTION),
      where("textHash", "==", textHash),
      where("voiceId", "==", voiceId),
      limit(1)
    );
    const snap = await getDocs(q);
    if (snap.empty) return null;
    return (snap.docs[0].data().audioUrl as string) ?? null;
  } catch {
    return null;
  }
}

export async function cacheVoiceover(
  text: string,
  voiceId: string,
  audioUrl: string,
  durationMs: number
): Promise<void> {
  if (!isFirebaseConfigured()) return;

  const textHash = hashText(text);
  const docId = `vo-${textHash}-${voiceId.slice(0, 8)}`;

  try {
    const db = getDB();
    await setDoc(doc(db, COLLECTION, docId), {
      textHash,
      text: text.slice(0, 500), // Store truncated for debugging
      voiceId,
      audioUrl,
      durationMs,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Fire-and-forget — cache miss next time is fine
  }
}
