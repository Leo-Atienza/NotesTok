import { NextRequest, NextResponse } from "next/server";
import { ai, MODEL } from "@/lib/gemini";
import { PANIC_REGENERATION_PROMPT } from "@/lib/prompts";

export async function POST(req: NextRequest) {
  try {
    const { original, concept } = await req.json();

    if (!original || !concept) {
      return NextResponse.json(
        { error: "Missing original explanation or concept." },
        { status: 400 }
      );
    }

    const prompt = PANIC_REGENERATION_PROMPT.replace("{original}", original).replace("{concept}", concept);

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Failed to generate simpler explanation." },
        { status: 500 }
      );
    }

    return NextResponse.json({ simplerExplanation: text.trim() });
  } catch (error) {
    console.error("Panic regeneration error:", error);
    return NextResponse.json(
      { error: "Failed to generate simpler explanation." },
      { status: 500 }
    );
  }
}
