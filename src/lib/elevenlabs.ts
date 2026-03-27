const ELEVENLABS_BASE = "https://api.elevenlabs.io/v1";
const DEFAULT_VOICE_ID = "21m00Tcm4TlvDq8ikWAM"; // Rachel — clear, neutral
const DEFAULT_MODEL = "eleven_flash_v2_5";

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}

export interface VoiceoverTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export async function generateVoiceover(
  text: string,
  voiceId: string = DEFAULT_VOICE_ID
): Promise<{ audioUrl: string; durationMs: number; wordTimings: VoiceoverTiming[] } | null> {
  if (!isElevenLabsConfigured()) return null;

  try {
    const res = await fetch(`${ELEVENLABS_BASE}/text-to-speech/${voiceId}/with-timestamps`, {
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

    const data = await res.json();
    const base64 = data.audio_base64;
    const audioUrl = `data:audio/mpeg;base64,${base64}`;

    const wordTimings: VoiceoverTiming[] = [];
    let durationMs = 0;

    if (data.alignment && data.alignment.characters) {
      const chars = data.alignment.characters as string[];
      const starts = data.alignment.character_start_times_seconds as number[];
      const ends = data.alignment.character_end_times_seconds as number[];

      let currentWord = "";
      let wordStartSec = 0;

      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (currentWord === "") {
          wordStartSec = starts[i];
        }
        
        if (char.match(/[a-zA-Z0-9']/)) {
          currentWord += char;
        } else {
          if (currentWord.length > 0) {
            wordTimings.push({
              word: currentWord,
              startMs: Math.round(wordStartSec * 1000),
              endMs: Math.round(ends[i - 1] * 1000),
            });
            currentWord = "";
          }
        }
      }
      
      if (currentWord.length > 0) {
        wordTimings.push({
          word: currentWord,
          startMs: Math.round(wordStartSec * 1000),
          endMs: Math.round(ends[chars.length - 1] * 1000),
        });
      }

      if (ends.length > 0) {
        durationMs = Math.round(ends[ends.length - 1] * 1000);
      }
    }

    if (durationMs === 0) {
      // Fallback if alignment failed
      const wordCount = text.split(/\s+/).length;
      durationMs = Math.round((wordCount / 2.5) * 1000);
    }

    return { audioUrl, durationMs, wordTimings };
  } catch (error) {
    console.error("ElevenLabs API Error:", error);
    return null;
  }
}

export async function generateSfx(prompt: string): Promise<string | null> {
  if (!isElevenLabsConfigured()) return null;

  try {
    const res = await fetch(`${ELEVENLABS_BASE}/sound-generation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY!,
      },
      body: JSON.stringify({
        text: prompt,
        duration_seconds: 2.5,
        prompt_influence: 0.4,
      }),
    });

    if (!res.ok) {
      console.error("ElevenLabs SFX Error:", await res.text());
      return null;
    }

    // Response is audio/mpeg bytes
    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    return `data:audio/mpeg;base64,${base64}`;
  } catch (error) {
    console.error("ElevenLabs SFX Exception:", error);
    return null;
  }
}
