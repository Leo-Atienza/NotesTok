import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";

const SUPER_DETAIL_PROMPT = `You are an expert tutor creating the most detailed possible explanation. Take this content and break it into the finest granularity possible.

RULES:
- Every step gets sub-steps. Every sub-step gets mini-steps.
- For math: explain every single transformation, every algebraic move.
- Show the "why" behind each step, not just the "what".
- Use numbered lists for clear progression.
- Bold key terms and important concepts.
- Keep language accessible but thorough.
- Use analogies where helpful.
- Think of it like zooming in with a microscope — show every detail.

ORIGINAL CONTENT:
`;

export async function POST(req: NextRequest) {
  try {
    const { content, title } = await req.json();

    if (!content || typeof content !== "string") {
      return NextResponse.json({ error: "content required" }, { status: 400 });
    }

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: SUPER_DETAIL_PROMPT + content + (title ? `\n\nTOPIC: ${title}` : ""),
      })
    );

    const detailed = response.text ?? content;
    return NextResponse.json({ detailed });
  } catch (error) {
    console.error("Super detail error:", error);
    return NextResponse.json(
      { error: "Failed to generate detailed breakdown." },
      { status: 500 }
    );
  }
}
