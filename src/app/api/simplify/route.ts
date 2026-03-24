import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";
import { GLOBAL_SCHOLAR_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { content, keyTerms } = await req.json();

    if (!content) {
      return NextResponse.json(
        { error: "Missing content to simplify." },
        { status: 400 }
      );
    }

    const prompt = GLOBAL_SCHOLAR_PROMPT
      .replace("{keyTerms}", (keyTerms || []).join(", "))
      .replace("{text}", content);

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: prompt,
      })
    );

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Failed to simplify content." },
        { status: 500 }
      );
    }

    return NextResponse.json({ simplifiedContent: text.trim() });
  } catch (error) {
    console.error("Simplification error:", error);
    return NextResponse.json(
      { error: "Failed to simplify content." },
      { status: 500 }
    );
  }
}
