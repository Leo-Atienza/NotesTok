import { NextResponse } from "next/server";
import { isFirebaseConfigured } from "@/lib/firebase";
import { isPexelsConfigured, searchVideos, searchPhotos } from "@/lib/pexels";
import { ingestPexelsVideo, ingestPexelsPhoto } from "@/lib/media-store";
import type { AssetMood } from "@/lib/media-types";

interface SeedQuery {
  query: string;
  subjects: string[];
  moods: AssetMood[];
  tags: string[];
}

const DEFAULT_QUERIES: SeedQuery[] = [
  // Biology
  { query: "microscope cells", subjects: ["biology"], moods: ["calm", "tech"], tags: ["microscope", "cells", "biology", "science"] },
  { query: "dna helix", subjects: ["biology"], moods: ["tech"], tags: ["dna", "genetics", "biology", "helix"] },
  { query: "nature ecosystem forest", subjects: ["biology"], moods: ["calm", "uplifting"], tags: ["nature", "ecosystem", "forest", "plants"] },
  // History
  { query: "ancient castle fortress", subjects: ["history"], moods: ["dramatic"], tags: ["castle", "fortress", "medieval", "ancient"] },
  { query: "old library books", subjects: ["history"], moods: ["calm", "dramatic"], tags: ["library", "books", "knowledge", "reading"] },
  // CS
  { query: "programming code screen", subjects: ["cs", "computer science"], moods: ["tech"], tags: ["code", "programming", "computer", "software"] },
  { query: "server room technology", subjects: ["cs", "computer science"], moods: ["tech", "dark"], tags: ["server", "technology", "data", "network"] },
  { query: "circuit board electronics", subjects: ["cs", "computer science"], moods: ["tech"], tags: ["circuit", "electronics", "hardware", "chip"] },
  // Physics
  { query: "space galaxy stars", subjects: ["physics"], moods: ["dramatic", "dark"], tags: ["space", "galaxy", "stars", "universe"] },
  { query: "lightning energy", subjects: ["physics"], moods: ["energetic", "dramatic"], tags: ["lightning", "energy", "electricity", "power"] },
  { query: "abstract particles light", subjects: ["physics"], moods: ["tech", "energetic"], tags: ["particles", "light", "abstract", "quantum"] },
  // Math
  { query: "geometric shapes abstract", subjects: ["math"], moods: ["calm", "tech"], tags: ["geometry", "shapes", "abstract", "patterns"] },
  { query: "equations chalkboard", subjects: ["math"], moods: ["calm"], tags: ["equations", "chalkboard", "mathematics", "formula"] },
  // Chemistry
  { query: "chemistry lab experiment", subjects: ["chemistry"], moods: ["tech", "energetic"], tags: ["chemistry", "lab", "experiment", "science"] },
  { query: "molecules atoms structure", subjects: ["chemistry"], moods: ["tech"], tags: ["molecules", "atoms", "structure", "chemical"] },
  // Geography
  { query: "world map globe", subjects: ["geography"], moods: ["uplifting"], tags: ["map", "globe", "world", "earth"] },
  { query: "mountain landscape aerial", subjects: ["geography"], moods: ["dramatic", "uplifting"], tags: ["mountain", "landscape", "aerial", "nature"] },
  // General fallbacks
  { query: "abstract dark flowing", subjects: [], moods: ["dark", "calm"], tags: ["abstract", "dark", "flowing", "atmospheric"] },
  { query: "neon lights city night", subjects: [], moods: ["energetic", "tech"], tags: ["neon", "city", "night", "lights"] },
  { query: "smoke fog atmosphere", subjects: [], moods: ["dramatic", "dark"], tags: ["smoke", "fog", "atmosphere", "mood"] },
  { query: "rain moody cinematic", subjects: [], moods: ["dramatic", "dark"], tags: ["rain", "moody", "cinematic", "weather"] },
  { query: "bokeh particles glowing", subjects: [], moods: ["calm", "uplifting"], tags: ["bokeh", "particles", "glowing", "light"] },
  { query: "ocean waves water", subjects: [], moods: ["calm"], tags: ["ocean", "waves", "water", "sea"] },
  { query: "fire flames burning", subjects: [], moods: ["dramatic", "energetic"], tags: ["fire", "flames", "burning", "heat"] },
  { query: "sunset clouds colorful", subjects: [], moods: ["uplifting", "calm"], tags: ["sunset", "clouds", "sky", "colorful"] },
];

export async function POST(request: Request) {
  if (!isFirebaseConfigured() || !isPexelsConfigured()) {
    return NextResponse.json(
      { error: "Both Firebase and Pexels must be configured to seed" },
      { status: 400 }
    );
  }

  let customQueries: string[] | undefined;
  try {
    const body = await request.json();
    customQueries = body.queries;
  } catch {
    // No body is fine — use defaults
  }

  const queries = customQueries
    ? customQueries.map((q: string) => ({
        query: q,
        subjects: [],
        moods: ["calm" as AssetMood],
        tags: q.split(/\s+/),
      }))
    : DEFAULT_QUERIES;

  let seeded = 0;
  let errors = 0;

  for (const sq of queries) {
    try {
      // Search videos + photos
      const [videos, photos] = await Promise.all([
        searchVideos(sq.query, { perPage: 5 }),
        searchPhotos(sq.query, { perPage: 5 }),
      ]);

      // Ingest videos
      for (const v of videos) {
        const result = await ingestPexelsVideo(v, sq.subjects, sq.moods, sq.tags);
        if (result) seeded++;
      }

      // Ingest photos
      for (const p of photos) {
        const result = await ingestPexelsPhoto(p, sq.subjects, sq.moods, sq.tags);
        if (result) seeded++;
      }
    } catch {
      errors++;
    }

    // Rate limit: 2s between batches
    await new Promise((r) => setTimeout(r, 2000));
  }

  return NextResponse.json({ seeded, errors, totalQueries: queries.length });
}
