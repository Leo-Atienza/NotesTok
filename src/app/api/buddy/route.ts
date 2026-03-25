import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const { message, context } = await req.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json({ error: "message required" }, { status: 400 });
    }

    const systemPrompt = `You are a friendly, encouraging AI study buddy named Toki. You're helping a student who is studying "${context?.lessonTitle || "a topic"}" (${context?.subject || "general"}).

Current segment they're on: "${context?.segmentTitle || "unknown"}"
Segment content: ${context?.segmentContent || "N/A"}
Learning profile: ${context?.learnerProfile || "general"}

RULES:
- Be warm, supportive, and concise (1-3 sentences)
- Answer questions about the material using the segment content as reference
- If you don't know, say so honestly — don't make things up
- Use casual language and occasional emojis
- If they're struggling, give encouragement then a simpler explanation
- Adapt your complexity to their learning profile`;

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: [
          { role: "user", parts: [{ text: systemPrompt + "\n\nStudent asks: " + message }] },
        ],
      })
    );

    const reply = response.text ?? "Hmm, I'm not sure about that. Could you rephrase?";
    return NextResponse.json({ reply });
  } catch (error) {
    console.error("Buddy chat error:", error);
    return NextResponse.json({ reply: "I'm having trouble thinking right now. Try again in a moment!" });
  }
}
