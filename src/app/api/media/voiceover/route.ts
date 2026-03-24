import { NextResponse } from "next/server";
import { generateVoiceover, isElevenLabsConfigured } from "@/lib/elevenlabs";
import { getCachedVoiceover, cacheVoiceover } from "@/lib/voiceover-cache";

const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM";

interface VoiceoverSegment {
  id: string;
  content: string;
}

interface VoiceoverRequest {
  segments: VoiceoverSegment[];
}

export async function POST(request: Request) {
  try {
    const body: VoiceoverRequest = await request.json();
    const { segments } = body;

    if (!segments || !Array.isArray(segments)) {
      return NextResponse.json({ error: "segments array required" }, { status: 400 });
    }

    if (!isElevenLabsConfigured()) {
      return NextResponse.json({ voiceovers: {} });
    }

    const voiceovers: Record<string, string | null> = {};

    // Process sequentially to respect ElevenLabs rate limits
    for (const seg of segments) {
      // 1. Check cache
      const cached = await getCachedVoiceover(seg.content, DEFAULT_VOICE_ID);
      if (cached) {
        voiceovers[seg.id] = cached;
        continue;
      }

      // 2. Generate fresh
      const result = await generateVoiceover(seg.content);
      if (result) {
        voiceovers[seg.id] = result.audioUrl;
        // 3. Cache (fire-and-forget)
        cacheVoiceover(seg.content, DEFAULT_VOICE_ID, result.audioUrl, result.durationMs).catch(() => {});
      } else {
        voiceovers[seg.id] = null;
      }
    }

    return NextResponse.json({ voiceovers });
  } catch (error) {
    console.error("Voiceover generation error:", error);
    return NextResponse.json({ voiceovers: {} });
  }
}
