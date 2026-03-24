import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";
import { MANIFEST_GENERATION_PROMPT } from "@/lib/prompts";
import { lessonManifestSchema } from "@/lib/manifest-schema";
import type { ContentAnalysis, LessonManifest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const analysis: ContentAnalysis = await req.json();

    if (!analysis.concepts || analysis.concepts.length === 0) {
      return NextResponse.json(
        { error: "No concepts found in analysis." },
        { status: 400 }
      );
    }

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: MANIFEST_GENERATION_PROMPT + JSON.stringify(analysis, null, 2),
        config: {
          responseMimeType: "application/json",
          responseSchema: lessonManifestSchema,
        },
      })
    );

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Failed to generate lesson. Please try again." },
        { status: 500 }
      );
    }

    const manifest: LessonManifest = JSON.parse(text);

    // Ensure segments are ordered
    manifest.segments.sort((a, b) => a.order - b.order);

    return NextResponse.json(manifest);
  } catch (error) {
    console.error("Lesson generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate lesson. Please try again." },
      { status: 500 }
    );
  }
}
