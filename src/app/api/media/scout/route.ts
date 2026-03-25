import { NextResponse } from "next/server";
import { scoutResources } from "@/lib/resource-scout";
import type { Segment } from "@/lib/types";
import type { CharacterId } from "@/lib/media-types";

export const runtime = "nodejs";

/**
 * POST /api/media/scout
 *
 * AI-powered resource scout: plans and resolves visual assets for a lesson segment.
 * The "cauldron" endpoint — takes a segment and returns URLs for backgrounds,
 * GIFs, Lottie effects, character poses, stickers, and meme text per scene.
 *
 * Body: { segment: Segment, subject: string, characterId?: CharacterId }
 * Returns: ResolvedSegmentResources
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { segment, subject, characterId } = body as {
      segment: Segment;
      subject: string;
      characterId?: CharacterId;
    };

    if (!segment?.content || !subject) {
      return NextResponse.json(
        { error: "segment (with content) and subject are required" },
        { status: 400 }
      );
    }

    const resources = await scoutResources(
      segment,
      subject,
      characterId ?? "hoodie-student"
    );

    return NextResponse.json(resources);
  } catch (error) {
    console.error("[scout] Error:", error);
    const message = error instanceof Error ? error.message : "Scout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
