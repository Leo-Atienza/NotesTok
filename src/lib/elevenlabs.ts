const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — clear, neutral
const DEFAULT_MODEL = "eleven_flash_v2_5";

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

export async function generateVoiceover(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<{ audioUrl: string; durationMs: number } | null> {
  if (!isElevenLabsConfigured()) return null;

  try {
    const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text,
        model_id: DEFAULT_MODEL,
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
        },
      }),
    });

    if (!res.ok) return null;

    const audioBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(audioBuffer).toString("base64");
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    // Estimate duration: ~150 words/min = 2.5 words/sec = 400ms/word
    const wordCount = text.split(/\s+/).length;
    const durationMs = Math.round((wordCount / 2.5) * 1000);

    return { audioUrl, durationMs };
  } catch {
    return null;
  }
}
