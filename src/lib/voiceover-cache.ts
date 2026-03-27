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
import type { VoiceoverTiming } from "./elevenlabs";

const COLLECTION = "voiceover_cache";

/**
 * FNV-1a 64-bit hash (as two 32-bit halves) for cache key.
 * Much lower collision probability than the original 32-bit djb2.
 */
function hashText(text: string): string {
  // FNV offset basis and prime for 32-bit (we run two passes with different seeds)
  let h1 = 0x811c9dc5;
  let h2 = 0x62b82175; // secondary seed
  for (let i = 0; i < text.length; i++) {
    const c = text.charCodeAt(i);
    h1 ^= c;
    h1 = Math.imul(h1, 0x01000193);
    h2 ^= c;
    h2 = Math.imul(h2, 0x01000193);
  }
  return (h1 >>> 0).toString(16).padStart(8, "0") +
         (h2 >>> 0).toString(16).padStart(8, "0");
}

export interface CachedVoiceover {
  audioUrl: string;
  durationMs: number;
  wordTimings: VoiceoverTiming[];
}

export async function getCachedVoiceover(
  text: string,
  voiceId: string
): Promise<CachedVoiceover | null> {
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
    const data = snap.docs[0].data();
    return {
      audioUrl: data.audioUrl,
      durationMs: data.durationMs || 0,
      wordTimings: (data.wordTimings || []) as VoiceoverTiming[]
    };
  } catch {
    return null;
  }
}

export async function cacheVoiceover(
  text: string,
  voiceId: string,
  audioUrl: string,
  durationMs: number,
  wordTimings: VoiceoverTiming[] = []
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
      wordTimings,
      createdAt: serverTimestamp(),
    });
  } catch {
    // Fire-and-forget — cache miss next time is fine
  }
}
