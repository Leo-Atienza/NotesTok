import { NextRequest, NextResponse } from "next/server";
import { ai, MODEL } from "@/lib/gemini";
import { CONTENT_ANALYSIS_PROMPT } from "@/lib/prompts";
import { contentAnalysisSchema } from "@/lib/manifest-schema";
import type { ContentAnalysis } from "@/lib/types";

// pdf-parse requires Node.js runtime (not Edge)
export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const textInput = formData.get("text") as string | null;
    const file = formData.get("file") as File | null;

    let notesText = "";

    if (textInput && textInput.trim().length > 0) {
      notesText = textInput.trim();
    } else if (file) {
      // For PDF files, extract text using pdf-parse
      if (file.type === "application/pdf") {
        const buffer = Buffer.from(await file.arrayBuffer());
        // Dynamic import to avoid issues with pdf-parse in edge runtime
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        notesText = pdfData.text;
      } else {
        // Plain text file
        notesText = await file.text();
      }
    }

    if (!notesText || notesText.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide at least 50 characters of study notes." },
        { status: 400 }
      );
    }

    // Truncate to ~8000 chars to manage token usage
    if (notesText.length > 8000) {
      notesText = notesText.slice(0, 8000);
    }

    const response = await ai.models.generateContent({
      model: MODEL,
      contents: CONTENT_ANALYSIS_PROMPT + notesText,
      config: {
        responseMimeType: "application/json",
        responseSchema: contentAnalysisSchema,
      },
    });

    const text = response.text;
    if (!text) {
      return NextResponse.json(
        { error: "Failed to analyze content. Please try again." },
        { status: 500 }
      );
    }

    const analysis: ContentAnalysis = JSON.parse(text);
    return NextResponse.json(analysis);
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze content. Please try again." },
      { status: 500 }
    );
  }
}
