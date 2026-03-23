import type { Caption } from "@remotion/captions";

/**
 * Generate word-level timing data from segment text content.
 * Uses estimated speech duration (no real TTS timestamps needed).
 */
export function generateCaptionData(
  content: string,
  wordsPerSecond = 2.8
): Caption[] {
  const words = content.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const msPerWord = 1000 / wordsPerSecond;
  const captions: Caption[] = [];

  let currentMs = 200; // small lead-in pause

  for (const word of words) {
    const duration = msPerWord;
    captions.push({
      text: word,
      startMs: Math.round(currentMs),
      endMs: Math.round(currentMs + duration),
      timestampMs: Math.round(currentMs + duration / 2),
      confidence: 1,
    });
    currentMs += duration;
  }

  return captions;
}

/**
 * Calculate total duration in frames for a segment's content.
 */
export function getSegmentDurationInFrames(
  content: string,
  fps: number,
  wordsPerSecond = 2.8
): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  const durationSec = words / wordsPerSecond + 1.5; // +1.5s buffer (lead-in + tail)
  return Math.ceil(durationSec * fps);
}
