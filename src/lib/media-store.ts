import {
  collection,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  getDocs,
  doc,
  setDoc,
  updateDoc,
  increment,
  serverTimestamp,
} from "firebase/firestore";
import { getDB, isFirebaseConfigured } from "./firebase";
import { searchVideos, searchPhotos, pickBestVideoFile, isPexelsConfigured } from "./pexels";
import * as pixabay from "./pixabay";
import { searchGifs, getGifMp4Url, isKlipyConfigured } from "./klipy";
import type {
  MediaAsset, MediaQuery, PexelsVideo, PexelsPhoto, AssetMood,
  KlipyGif, PixabayVideo, PixabayPhoto,
  GifCategory, GifEmotion, CharacterId, CharacterPose,
} from "./media-types";

const COLLECTION = "media_assets";

// === Query ===

export async function queryAssets(params: MediaQuery): Promise<MediaAsset[]> {
  if (!isFirebaseConfigured()) return [];

  const db = getDB();
  const col = collection(db, COLLECTION);
  const limit = params.limit ?? 5;

  // Strategy 1: subjects + type
  if (params.subjects && params.subjects.length > 0) {
    const results = await runQuery(col, params.type, "subjects", params.subjects, params.orientation, limit);
    if (results.length >= 3) return results;
  }

  // Strategy 2: tags + type
  if (params.tags && params.tags.length > 0) {
    const results = await runQuery(col, params.type, "tags", params.tags, params.orientation, limit);
    if (results.length >= 3) return results;
  }

  // Strategy 3: moods + type
  if (params.moods && params.moods.length > 0) {
    const results = await runQuery(col, params.type, "moods", params.moods, params.orientation, limit);
    if (results.length >= 3) return results;
  }

  // Strategy 4: any of this type + orientation
  try {
    const q = params.orientation
      ? query(col, where("type", "==", params.type), where("orientation", "==", params.orientation), orderBy("usageCount", "asc"), firestoreLimit(limit))
      : query(col, where("type", "==", params.type), orderBy("usageCount", "asc"), firestoreLimit(limit));
    const snap = await getDocs(q);
    return snap.docs.map(docToAsset);
  } catch {
    return [];
  }
}

async function runQuery(
  col: ReturnType<typeof collection>,
  type: string,
  field: string,
  values: string[],
  orientation: string | undefined,
  maxResults: number
): Promise<MediaAsset[]> {
  try {
    // Firestore array-contains-any supports up to 30 values
    const slice = values.slice(0, 10).map((v) => v.toLowerCase());
    const q = orientation
      ? query(col, where("type", "==", type), where(field, "array-contains-any", slice), where("orientation", "==", orientation), orderBy("usageCount", "asc"), firestoreLimit(maxResults))
      : query(col, where("type", "==", type), where(field, "array-contains-any", slice), orderBy("usageCount", "asc"), firestoreLimit(maxResults));
    const snap = await getDocs(q);
    return snap.docs.map(docToAsset);
  } catch {
    return [];
  }
}

function docToAsset(doc: { id: string; data: () => Record<string, unknown> }): MediaAsset {
  const d = doc.data();
  return {
    id: doc.id,
    type: d.type as MediaAsset["type"],
    storageUrl: d.storageUrl as string,
    thumbnailUrl: d.thumbnailUrl as string | undefined,
    fileSize: (d.fileSize as number) ?? 0,
    format: (d.format as string) ?? "",
    duration: d.duration as number | undefined,
    width: d.width as number | undefined,
    height: d.height as number | undefined,
    subjects: (d.subjects as string[]) ?? [],
    moods: (d.moods as AssetMood[]) ?? [],
    energy: (d.energy as MediaAsset["energy"]) ?? "medium",
    tags: (d.tags as string[]) ?? [],
    colors: (d.colors as string[]) ?? [],
    orientation: d.orientation as MediaAsset["orientation"],
    source: (d.source as MediaAsset["source"]) ?? "pexels",
    sourceId: d.sourceId as string | undefined,
    attribution: d.attribution as string | undefined,
    license: (d.license as string) ?? "pexels",
    loopable: (d.loopable as boolean) ?? false,
    usageCount: (d.usageCount as number) ?? 0,
    createdAt: d.createdAt ? new Date((d.createdAt as { seconds: number }).seconds * 1000) : new Date(),
  };
}

// === Ingestion ===

export async function ingestPexelsVideo(
  video: PexelsVideo,
  subjects: string[],
  moods: AssetMood[],
  tags: string[]
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `pexels-video-${video.id}`;

  // Dedup check
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", String(video.id)), where("source", "==", "pexels"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const bestFile = pickBestVideoFile(video);
  if (!bestFile) return null;

  const isPortrait = video.height > video.width;
  const asset: Omit<MediaAsset, "id" | "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    type: "video",
    storageUrl: bestFile.link,
    thumbnailUrl: video.image,
    fileSize: 0,
    format: "mp4",
    duration: video.duration,
    width: bestFile.width,
    height: bestFile.height,
    subjects: subjects.map((s) => s.toLowerCase()),
    moods,
    energy: "medium",
    tags: tags.map((t) => t.toLowerCase()),
    colors: [],
    orientation: isPortrait ? "portrait" : "landscape",
    source: "pexels",
    sourceId: String(video.id),
    attribution: `Video by ${video.user.name} on Pexels`,
    license: "pexels",
    loopable: video.duration <= 30,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as MediaAsset;
  } catch {
    return null;
  }
}

export async function ingestPexelsPhoto(
  photo: PexelsPhoto,
  subjects: string[],
  moods: AssetMood[],
  tags: string[]
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `pexels-photo-${photo.id}`;

  // Dedup check
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", String(photo.id)), where("source", "==", "pexels"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const isPortrait = photo.height > photo.width;
  const asset: Omit<MediaAsset, "id" | "createdAt"> & { createdAt: ReturnType<typeof serverTimestamp> } = {
    type: "photo",
    storageUrl: photo.src.large2x,
    thumbnailUrl: photo.src.medium,
    fileSize: 0,
    format: "jpg",
    width: photo.width,
    height: photo.height,
    subjects: subjects.map((s) => s.toLowerCase()),
    moods,
    energy: "medium",
    tags: tags.map((t) => t.toLowerCase()),
    colors: [],
    orientation: isPortrait ? "portrait" : "landscape",
    source: "pexels",
    sourceId: String(photo.id),
    attribution: `Photo by ${photo.photographer} on Pexels`,
    license: "pexels",
    loopable: false,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as MediaAsset;
  } catch {
    return null;
  }
}

// === Auto-Growth Core ===

export interface MediaAssetResult {
  url: string;
  thumbnailUrl?: string;
  type: "video" | "photo";
  assetId?: string;
  width?: number;
  height?: number;
  duration?: number;
}

export async function findOrFetchMedia(
  keyTerms: string[],
  title: string,
  segmentType: string,
  subject: string,
  assetType: "video" | "photo"
): Promise<MediaAssetResult[]> {
  // 1. Try DB first
  const dbResults = await queryAssets({
    type: assetType,
    subjects: [subject.toLowerCase()],
    tags: keyTerms.map((t) => t.toLowerCase()),
    orientation: "portrait",
    limit: 5,
  });

  if (dbResults.length >= 3) {
    return dbResults.map(assetToResult);
  }

  // 2. Fall back to Pexels
  if (!isPexelsConfigured()) return dbResults.map(assetToResult);

  const queries = generateSearchQueries(keyTerms, title, subject);
  let pexelsResults: MediaAssetResult[] = [];

  for (const q of queries) {
    if (pexelsResults.length >= 3) break;

    if (assetType === "video") {
      const videos = await searchVideos(q, { perPage: 3 });
      for (const v of videos) {
        const bestFile = pickBestVideoFile(v);
        if (bestFile) {
          pexelsResults.push({
            url: bestFile.link,
            thumbnailUrl: v.image,
            type: "video",
            width: bestFile.width,
            height: bestFile.height,
            duration: v.duration,
          });
          // Fire-and-forget ingestion
          ingestPexelsVideo(v, [subject], ["calm"], keyTerms).catch(() => {});
        }
      }
    } else {
      const photos = await searchPhotos(q, { perPage: 3 });
      for (const p of photos) {
        pexelsResults.push({
          url: p.src.large2x,
          thumbnailUrl: p.src.medium,
          type: "photo",
          width: p.width,
          height: p.height,
        });
        // Fire-and-forget ingestion
        ingestPexelsPhoto(p, [subject], ["calm"], keyTerms).catch(() => {});
      }
    }
  }

  // Combine DB results with Pexels results, dedup by URL
  const seen = new Set(dbResults.map((a) => a.storageUrl));
  const combined = dbResults.map(assetToResult);
  for (const r of pexelsResults) {
    if (!seen.has(r.url)) {
      seen.add(r.url);
      combined.push(r);
    }
  }

  return combined;
}

function assetToResult(asset: MediaAsset): MediaAssetResult {
  return {
    url: asset.storageUrl,
    thumbnailUrl: asset.thumbnailUrl,
    type: asset.type as "video" | "photo",
    assetId: asset.id,
    width: asset.width,
    height: asset.height,
    duration: asset.duration,
  };
}

function generateSearchQueries(keyTerms: string[], title: string, subject: string): string[] {
  const queries: string[] = [];

  // Most specific: key terms combined
  if (keyTerms.length > 0) {
    queries.push(keyTerms.slice(0, 3).join(" "));
  }

  // Medium: title words
  const titleWords = title.split(/\s+/).filter((w) => w.length > 3).slice(0, 3);
  if (titleWords.length > 0) {
    queries.push(titleWords.join(" "));
  }

  // Broad: subject
  queries.push(subject);

  // Fallback: generic atmospheric
  queries.push("abstract dark atmospheric");

  return queries;
}

// === Usage Tracking ===

export function recordUsage(assetId: string): void {
  if (!isFirebaseConfigured() || !assetId) return;
  try {
    const db = getDB();
    updateDoc(doc(db, COLLECTION, assetId), {
      usageCount: increment(1),
      lastUsedAt: serverTimestamp(),
    }).catch(() => {});
  } catch { /* fire-and-forget */ }
}

// === Music & SFX ===

const SUBJECT_MOOD_MAP: Record<string, AssetMood> = {
  biology: "calm",
  chemistry: "tech",
  physics: "energetic",
  math: "calm",
  history: "dramatic",
  literature: "calm",
  "computer science": "tech",
  cs: "tech",
  programming: "tech",
  geography: "uplifting",
  art: "playful",
  music: "playful",
};

// Static audio paths — these are bundled in /public/audio/
const STATIC_MUSIC: Record<string, string> = {
  calm: "/audio/bg-lofi.mp3",
  dramatic: "/audio/bg-dramatic.mp3",
  tech: "/audio/bg-tech.mp3",
  energetic: "/audio/bg-tech.mp3",
  uplifting: "/audio/bg-lofi.mp3",
  dark: "/audio/bg-dramatic.mp3",
  playful: "/audio/bg-lofi.mp3",
};

const STATIC_SFX: Record<string, string> = {
  whoosh: "/audio/sfx-whoosh.mp3",
  impact: "/audio/sfx-impact.mp3",
  success: "/audio/sfx-success.mp3",
  pop: "/audio/sfx-pop.mp3",
};

export function findMusic(subject: string): string | null {
  const mood = SUBJECT_MOOD_MAP[subject.toLowerCase()] ?? "calm";
  return STATIC_MUSIC[mood] ?? null;
}

export function findSfx(name: string): string | null {
  return STATIC_SFX[name.toLowerCase()] ?? null;
}

// === GIF Ingestion (Klipy) ===

export async function ingestKlipyGif(
  gif: KlipyGif,
  subjects: string[],
  tags: string[],
  category: GifCategory = "reaction",
  emotion?: GifEmotion
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `klipy-gif-${gif.id}`;

  // Dedup
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", gif.id), where("source", "==", "klipy"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const mp4Url = getGifMp4Url(gif);
  const asset = {
    type: "gif" as const,
    storageUrl: mp4Url,
    thumbnailUrl: gif.preview,
    fileSize: 0,
    format: "mp4",
    duration: gif.duration,
    width: gif.width,
    height: gif.height,
    subjects: subjects.map((s) => s.toLowerCase()),
    moods: ["playful"] as AssetMood[],
    energy: "high" as const,
    tags: [...tags.map((t) => t.toLowerCase()), category, ...(emotion ? [emotion] : [])],
    colors: [],
    orientation: (gif.height > gif.width ? "portrait" : "landscape") as MediaAsset["orientation"],
    source: "klipy" as const,
    sourceId: gif.id,
    license: "klipy",
    loopable: true,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as unknown as MediaAsset;
  } catch {
    return null;
  }
}

// === Pixabay Ingestion ===

export async function ingestPixabayVideo(
  video: PixabayVideo,
  subjects: string[],
  moods: AssetMood[],
  tags: string[]
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `pixabay-video-${video.id}`;

  // Dedup
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", String(video.id)), where("source", "==", "pixabay"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const bestFile = pixabay.pickBestVideoFile(video);
  if (!bestFile) return null;

  const asset = {
    type: "video" as const,
    storageUrl: bestFile.url,
    fileSize: 0,
    format: "mp4",
    duration: video.duration,
    width: bestFile.width,
    height: bestFile.height,
    subjects: subjects.map((s) => s.toLowerCase()),
    moods,
    energy: "medium" as const,
    tags: [...tags.map((t) => t.toLowerCase()), ...video.tags.split(",").map((t) => t.trim().toLowerCase())],
    colors: [],
    orientation: (bestFile.height > bestFile.width ? "portrait" : "landscape") as MediaAsset["orientation"],
    source: "pixabay" as const,
    sourceId: String(video.id),
    attribution: `Video by ${video.user} on Pixabay`,
    license: "pixabay",
    loopable: video.duration <= 30,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as unknown as MediaAsset;
  } catch {
    return null;
  }
}

export async function ingestPixabayPhoto(
  photo: PixabayPhoto,
  subjects: string[],
  moods: AssetMood[],
  tags: string[]
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `pixabay-photo-${photo.id}`;

  // Dedup
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", String(photo.id)), where("source", "==", "pixabay"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const isPortrait = photo.imageHeight > photo.imageWidth;
  const asset = {
    type: "photo" as const,
    storageUrl: photo.largeImageURL,
    thumbnailUrl: photo.webformatURL,
    fileSize: 0,
    format: "jpg",
    width: photo.imageWidth,
    height: photo.imageHeight,
    subjects: subjects.map((s) => s.toLowerCase()),
    moods,
    energy: "medium" as const,
    tags: [...tags.map((t) => t.toLowerCase()), ...photo.tags.split(",").map((t) => t.trim().toLowerCase())],
    colors: [],
    orientation: (isPortrait ? "portrait" : "landscape") as MediaAsset["orientation"],
    source: "pixabay" as const,
    sourceId: String(photo.id),
    attribution: `Photo by ${photo.user} on Pixabay`,
    license: "pixabay",
    loopable: false,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as unknown as MediaAsset;
  } catch {
    return null;
  }
}

// === Character Asset Ingestion ===

export async function ingestCharacterAsset(
  characterId: CharacterId,
  pose: CharacterPose,
  imageDataUrl: string
): Promise<MediaAsset | null> {
  if (!isFirebaseConfigured()) return null;

  const db = getDB();
  const docId = `character-${characterId}-${pose}`;

  // Dedup
  try {
    const existing = await getDocs(
      query(collection(db, COLLECTION), where("sourceId", "==", docId), where("type", "==", "character"), firestoreLimit(1))
    );
    if (!existing.empty) return docToAsset(existing.docs[0]);
  } catch { /* continue */ }

  const asset = {
    type: "character" as const,
    storageUrl: imageDataUrl,
    fileSize: 0,
    format: "png",
    width: 512,
    height: 512,
    subjects: [],
    moods: [] as AssetMood[],
    energy: "medium" as const,
    tags: [characterId, pose],
    colors: [],
    source: "generated" as const,
    sourceId: docId,
    license: "generated",
    loopable: false,
    usageCount: 0,
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, COLLECTION, docId), asset);
    return { ...asset, id: docId, createdAt: new Date() } as unknown as MediaAsset;
  } catch {
    return null;
  }
}

// === Enhanced findOrFetch with Pixabay + Klipy fallbacks ===

export async function findOrFetchGifs(
  query: string,
  emotion?: GifEmotion,
  subjects: string[] = [],
  limit = 3
): Promise<MediaAssetResult[]> {
  // 1. Try DB first
  const dbResults = await queryAssets({
    type: "gif",
    tags: [query.toLowerCase(), ...(emotion ? [emotion] : [])],
    limit,
  });

  if (dbResults.length >= limit) {
    return dbResults.map(assetToResult);
  }

  // 2. Fall back to Klipy
  if (!isKlipyConfigured()) return dbResults.map(assetToResult);

  const gifs = await searchGifs(`${query} ${emotion ?? ""}`.trim(), { limit });
  const results: MediaAssetResult[] = dbResults.map(assetToResult);
  const seen = new Set(results.map((r) => r.url));

  for (const gif of gifs) {
    const mp4Url = getGifMp4Url(gif);
    if (!seen.has(mp4Url)) {
      seen.add(mp4Url);
      results.push({
        url: mp4Url,
        thumbnailUrl: gif.preview,
        type: "video", // GIF MP4s render as video in Remotion
        width: gif.width,
        height: gif.height,
        duration: gif.duration,
      });
      // Fire-and-forget ingestion
      ingestKlipyGif(gif, subjects, [query.toLowerCase()], "reaction", emotion).catch(() => {});
    }
  }

  return results;
}

export async function findCharacterAsset(
  characterId: CharacterId,
  pose: CharacterPose
): Promise<MediaAsset | null> {
  const results = await queryAssets({
    type: "character",
    tags: [characterId, pose],
    limit: 1,
  });
  return results[0] ?? null;
}
