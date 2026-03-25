import { NextRequest, NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";
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
      const mimeType = file.type;

      if (mimeType === "application/pdf") {
        // PDF: extract text with pdf-parse
        const buffer = Buffer.from(await file.arrayBuffer());
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const pdfParse = require("pdf-parse");
        const pdfData = await pdfParse(buffer);
        notesText = pdfData.text;
      } else if (mimeType.startsWith("image/")) {
        // Image: use Gemini vision to OCR/extract text
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const extractResponse = await withRetry(() =>
          getAI().models.generateContent({
            model: MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: { mimeType, data: base64 },
                  },
                  {
                    text: "Extract ALL text from this image. If it's a photo of handwritten or printed notes, transcribe everything you can read. Return only the extracted text, nothing else.",
                  },
                ],
              },
            ],
          })
        );
        notesText = extractResponse.text ?? "";
      } else if (mimeType.startsWith("audio/")) {
        // Audio: use Gemini multimodal to transcribe
        const buffer = Buffer.from(await file.arrayBuffer());
        const base64 = buffer.toString("base64");
        const transcribeResponse = await withRetry(() =>
          getAI().models.generateContent({
            model: MODEL,
            contents: [
              {
                role: "user",
                parts: [
                  {
                    inlineData: { mimeType, data: base64 },
                  },
                  {
                    text: "Transcribe this audio recording. It contains study notes or a lecture. Return only the transcribed text, nothing else.",
                  },
                ],
              },
            ],
          })
        );
        notesText = transcribeResponse.text ?? "";
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

    const response = await withRetry(() =>
      getAI().models.generateContent({
        model: MODEL,
        contents: CONTENT_ANALYSIS_PROMPT + notesText,
        config: {
          responseMimeType: "application/json",
          responseSchema: contentAnalysisSchema,
        },
      })
    );

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
