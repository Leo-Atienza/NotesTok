import { NextRequest, NextResponse } from "next/server";
import { ai } from "@/lib/gemini";

export const runtime = "nodejs";

// Models to try in order of preference
const IMAGE_MODELS = [
  "gemini-2.5-flash-image",
  "gemini-3.1-flash-image-preview",
  "gemini-3-pro-image-preview",
];

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    const fullPrompt = `Generate an image: Educational illustration for a study app — ${prompt}. Style: clean, modern, colorful, vibrant, dramatic lighting. No text or words in the image.`;

    // Try Gemini native image generation models
    for (const model of IMAGE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: fullPrompt,
          config: {
            responseModalities: ["IMAGE", "TEXT"],
          },
        });

        const parts = response.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const part of parts) {
            if (part.inlineData?.data) {
              const mimeType = part.inlineData.mimeType || "image/png";
              return NextResponse.json({
                imageUrl: `data:${mimeType};base64,${part.inlineData.data}`,
              });
            }
          }
        }
      } catch {
        // This model failed — try the next one
        continue;
      }
    }

    // Try Imagen 4 as last resort (requires paid plan)
    try {
      const response = await ai.models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: `Educational illustration: ${prompt}. Clean, modern, colorful, no text.`,
        config: {
          numberOfImages: 1,
          aspectRatio: "9:16",
        },
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imageBytes) {
        return NextResponse.json({
          imageUrl: `data:image/png;base64,${imageBytes}`,
        });
      }
    } catch {
      // Imagen 4 not available on free tier
    }

    // All methods failed — return null for graceful fallback
    return NextResponse.json({ imageUrl: null }, { status: 200 });
  } catch (error) {
    console.error("Image generation error:", error);
    return NextResponse.json({ imageUrl: null }, { status: 200 });
  }
}
