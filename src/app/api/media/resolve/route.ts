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
}

interface SegmentMediaResult {
  videos: MediaAssetResult[];
  photos: MediaAssetResult[];
  memeUrl?: string;
  sfxUrl?: string;
}

export async function POST(request: Request) {
  try {
    const body: ResolveRequest = await request.json();
    const { segments, subject } = body;

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: "segments array required" }, { status: 400 });
    }

    // Resolve media for all segments in parallel
    const mediaPromises = segments.map(async (seg) => {
      const [videos, photos, gifs, aiSfx] = await Promise.allSettled([
        findOrFetchMedia(seg.keyTerms, seg.title, seg.type, subject, "video"),
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
