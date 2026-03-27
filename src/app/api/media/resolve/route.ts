import { NextResponse } from "next/server";
import { findOrFetchMedia, findMusic, findSfx, recordUsage, findOrFetchGifs } from "@/lib/media-store";
import type { MediaAssetResult } from "@/lib/media-store";
import { generateSfx } from "@/lib/elevenlabs";

interface ResolveSegment {
  id: string;
  keyTerms: string[];
  title: string;
  type: string;
}

interface ResolveRequest {
  segments: ResolveSegment[];
  subject: string;
  /** Video mode — used to customize media queries (e.g. brainrot fetches satisfying footage) */
  mode?: "brainrot" | "fireship" | "aistory" | "whiteboard";
}

/**
 * Satisfying/gameplay-style video queries for brainrot bottom half.
 * These produce the hypnotic, scroll-stopping footage that keeps viewers watching.
 * Organized into categories for variety — each segment picks from a different category.
 */
const BRAINROT_VIDEO_QUERIES = [
  // Satisfying processes
  "satisfying soap cutting asmr",
  "kinetic sand cutting satisfying",
  "slime mixing satisfying colorful",
  "hydraulic press crushing objects",
  "satisfying factory process assembly line",
  "oddly satisfying food preparation",
  // Abstract / motion graphics
  "abstract fluid simulation colorful",
  "colorful liquid pouring abstract",
  "paint mixing colorful swirl",
  "3d abstract motion graphics loop",
  "abstract particle flow neon",
  "geometric patterns animation loop",
  // Nature / mesmerizing
  "water drops slow motion colorful",
  "neon lights city night driving",
  "ocean waves aerial drone",
  "lava flow volcano close up",
  "northern lights aurora timelapse",
  "underwater coral reef colorful fish",
  // Urban / movement
  "subway train moving fast city",
  "car driving highway night neon",
  "roller coaster pov ride",
  "skateboarding tricks slow motion",
  "parkour urban running jumping",
];

interface SegmentMediaResult {
  videos: MediaAssetResult[];
  photos: MediaAssetResult[];
  memeUrl?: string;
  sfxUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body: ResolveRequest = await request.json();
    const { segments, subject, mode } = body;

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: "segments array required" }, { status: 400 });
    }

    const isBrainrot = mode === "brainrot";

    // For brainrot mode, each segment gets a DIFFERENT satisfying video for the bottom half
    // Shuffle queries to get variety across segments
    const shuffledBrainrotQueries = isBrainrot
      ? [...BRAINROT_VIDEO_QUERIES].sort(() => Math.random() - 0.5)
      : [];

    // Resolve media for all segments in parallel
    const mediaPromises = segments.map(async (seg, segIndex) => {
      // Brainrot: EVERY segment gets a satisfying video (different query each time)
      const brainrotQuery = isBrainrot
        ? shuffledBrainrotQueries[segIndex % shuffledBrainrotQueries.length]
        : null;

      const [videos, photos, gifs, aiSfx] = await Promise.allSettled([
        isBrainrot
          ? findOrFetchMedia([brainrotQuery!], brainrotQuery!, "video", "satisfying", "video")
          : findOrFetchMedia(seg.keyTerms, seg.title, seg.type, subject, "video"),
        findOrFetchMedia(seg.keyTerms, seg.title, seg.type, subject, "photo"),
        findOrFetchGifs(seg.keyTerms[0] || "mind blown", "funny", [subject], 1),
        generateSfx(`A high quality cinematic ${seg.type === "summary" ? "success ding" : "whoosh transition"} sound effect`),
      ]);

      const result: SegmentMediaResult = {
        videos: videos.status === "fulfilled" ? videos.value : [],
        photos: photos.status === "fulfilled" ? photos.value : [],
        memeUrl: gifs.status === "fulfilled" && gifs.value.length > 0 ? gifs.value[0].url : undefined,
        sfxUrl: aiSfx.status === "fulfilled" && aiSfx.value ? aiSfx.value : undefined,
      };

      // Record usage for DB assets (fire-and-forget)
      for (const v of result.videos) {
        if (v.assetId) recordUsage(v.assetId);
      }
      for (const p of result.photos) {
        if (p.assetId) recordUsage(p.assetId);
      }

      return { segmentId: seg.id, media: result };
    });

    const results = await Promise.allSettled(mediaPromises);

    const segmentMedia: Record<string, SegmentMediaResult> = {};
    for (const r of results) {
      if (r.status === "fulfilled") {
        segmentMedia[r.value.segmentId] = r.value.media;
      }
    }

    // Resolve music and SFX
    const music = findMusic(subject);
    const sfx = findSfx("whoosh");

    return NextResponse.json({ segmentMedia, music, sfx });
  } catch (error) {
    console.error("Media resolve error:", error);
    return NextResponse.json({ segmentMedia: {}, music: null, sfx: null });
  }
}
