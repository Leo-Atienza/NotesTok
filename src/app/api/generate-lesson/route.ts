import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";
import { MANIFEST_GENERATION_PROMPT, LEARNER_PROFILE_ADAPTATIONS } from "@/lib/prompts";
import { lessonManifestSchema } from "@/lib/manifest-schema";
import type { ContentAnalysis, LessonManifest } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { learnerProfile, ...analysis } = body as ContentAnalysis & { learnerProfile?: string };

    if (!analysis.concepts || analysis.concepts.length === 0) {
      return NextResponse.json(
        { error: "No concepts found in analysis." },
        { status: 400 }
      );
    }

    // Build prompt with optional learner profile adaptation
    let prompt = MANIFEST_GENERATION_PROMPT;
    if (learnerProfile && LEARNER_PROFILE_ADAPTATIONS[learnerProfile]) {
      prompt += LEARNER_PROFILE_ADAPTATIONS[learnerProfile] + "\n\n";
    }
    prompt += JSON.stringify(analysis, null, 2);

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: prompt,
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
