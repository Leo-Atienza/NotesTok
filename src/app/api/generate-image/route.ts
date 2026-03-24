import { NextRequest, NextResponse } from "next/server";
import { getAI } from "@/lib/gemini";

export const runtime = "nodejs";

// In-memory cache keyed by prompt hash
const imageCache = new Map<string, string>();

function hashPrompt(prompt: string): string {
  // Simple hash for caching
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const chr = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  return String(hash);
}

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

    // Check cache first
    const cacheKey = hashPrompt(prompt);
    const cached = imageCache.get(cacheKey);
    if (cached) {
      return NextResponse.json({ imageUrl: cached });
    }

    const fullPrompt = `Generate an image: Hyper-realistic, dramatic, cinematic scene — ${prompt}. Style: vivid colors, professional cinematic lighting, deep shadows, high contrast. NO text, NO words, NO letters, NO watermarks in the image.`;

    // Try Gemini native image generation models
    for (const model of IMAGE_MODELS) {
      try {
        const response = await getAI().models.generateContent({
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
              const imageUrl = `data:${mimeType};base64,${part.inlineData.data}`;
              // Cache the result
              imageCache.set(cacheKey, imageUrl);
              return NextResponse.json({ imageUrl });
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
      const response = await getAI().models.generateImages({
        model: "imagen-4.0-generate-001",
        prompt: `Cinematic dramatic scene: ${prompt}. Vivid colors, professional lighting, no text.`,
        config: {
          numberOfImages: 1,
          aspectRatio: "9:16",
        },
      });

      const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
      if (imageBytes) {
        const imageUrl = `data:image/png;base64,${imageBytes}`;
        imageCache.set(cacheKey, imageUrl);
        return NextResponse.json({ imageUrl });
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
