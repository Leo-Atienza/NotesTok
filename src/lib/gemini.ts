import { GoogleGenAI } from "@google/genai";

// Lazy initialization — avoids throwing during build when env var isn't set
let _ai: GoogleGenAI | null = null;

export function getAI(): GoogleGenAI {
  if (!_ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    _ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return _ai;
}

export const MODEL = "gemini-2.5-flash";

/** Retry a Gemini API call with exponential backoff on 429 rate limit errors */
export async function withRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      const isRateLimit =
        error instanceof Error &&
        (error.message.includes("429") || error.message.includes("RESOURCE_EXHAUSTED"));

      if (isRateLimit && attempt < maxRetries) {
        // Wait 5s * attempt (5s, 10s)
        await new Promise((r) => setTimeout(r, 5000 * (attempt + 1)));
        continue;
      }

      if (isRateLimit) {
        throw new Error(
          "AI is temporarily busy due to high demand. Please wait a moment and try again."
        );
      }
      throw error;
    }
  }
  throw new Error("Unexpected retry exhaustion");
}
