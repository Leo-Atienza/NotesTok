import type { Caption } from "@remotion/captions";

// === Scene system for TikTok-style rendering ===

export interface Scene {
  sceneIndex: number;
  sentence: string;
  keyWords: string[];
  startMs: number;
  endMs: number;
  wordTimings: { word: string; startMs: number; endMs: number }[];
}

// Words to skip when extracting key words for big overlay text
const SKIP_WORDS = new Set([
  "the", "a", "an", "is", "are", "was", "were", "be", "been", "being",
  "have", "has", "had", "do", "does", "did", "will", "would", "could",
  "should", "may", "might", "shall", "can", "to", "of", "in", "for",
  "on", "with", "at", "by", "from", "as", "into", "about", "like",
  "through", "after", "over", "between", "out", "up", "down", "off",
  "and", "but", "or", "nor", "not", "so", "yet", "both", "either",
  "neither", "each", "every", "all", "any", "few", "more", "most",
  "other", "some", "such", "no", "only", "own", "same", "than",
  "too", "very", "just", "also", "now", "here", "there", "then",
  "once", "when", "where", "why", "how", "what", "which", "who",
  "whom", "this", "that", "these", "those", "it", "its", "they",
  "them", "their", "we", "us", "our", "you", "your", "he", "him",
  "his", "she", "her", "my", "me", "i",
  // Common verbs that aren't impactful as overlay text
  "think", "make", "take", "give", "come", "know", "want", "need",
  "tell", "mean", "keep", "help", "turn", "show", "call", "work",
  "seem", "look", "feel", "find", "hear", "hand", "lets", "let's",
  "well", "really", "actually", "basically", "literally", "pretty",
  "much", "many", "even", "still", "already", "getting", "going",
  "being", "doing", "having", "making", "taking", "coming",
]);

function cleanWord(w: string): string {
  return w.replace(/[^a-zA-Z']/g, "");
}

function extractKeyWords(sentence: string, max = 4, keyTerms: string[] = []): string[] {
  const words = sentence.split(/\s+/).filter(Boolean);

  // First priority: words matching segment keyTerms
  const keyTermSet = new Set(keyTerms.map((t) => t.toLowerCase()));
  const fromKeyTerms: string[] = [];
  const otherCandidates: string[] = [];

  for (const w of words) {
    const cleaned = cleanWord(w);
    if (cleaned.length < 4) continue;
    if (SKIP_WORDS.has(cleaned.toLowerCase())) continue;

    // Check if this word matches any key term
    if (keyTermSet.has(cleaned.toLowerCase()) ||
        keyTerms.some((t) => t.toLowerCase().includes(cleaned.toLowerCase()) && cleaned.length >= 4)) {
      fromKeyTerms.push(cleaned);
    } else {
      otherCandidates.push(cleaned);
    }
  }

  // Combine: key terms first, then fill remaining with other candidates
  const combined = [...fromKeyTerms];
  for (const c of otherCandidates) {
    if (combined.length >= max) break;
    if (!combined.some((x) => x.toLowerCase() === c.toLowerCase())) {
      combined.push(c);
    }
  }

  // If we got nothing, take the 2 longest words from the sentence
  if (combined.length === 0) {
    const sorted = words
      .map((w) => cleanWord(w))
      .filter((w) => w.length >= 3)
      .sort((a, b) => b.length - a.length);
    return sorted.slice(0, 2);
  }

  return combined.slice(0, max);
}

function splitIntoSentences(content: string): string[] {
  // Split on sentence boundaries, keep non-empty
  const raw = content.split(/(?<=[.!?])\s+/);
  const sentences: string[] = [];
  for (const s of raw) {
    const trimmed = s.trim();
    if (trimmed.length > 0) sentences.push(trimmed);
  }
  // If no sentence breaks found, split into ~15-word chunks
  if (sentences.length <= 1 && content.split(/\s+/).length > 15) {
    const words = content.split(/\s+/);
    const chunks: string[] = [];
    for (let i = 0; i < words.length; i += 12) {
      chunks.push(words.slice(i, i + 12).join(" "));
    }
    return chunks;
  }
  return sentences;
}

export function generateSceneData(
  content: string,
  wordsPerSecond = 3.2,
  keyTerms: string[] = []
): Scene[] {
  const sentences = splitIntoSentences(content);
  if (sentences.length === 0) return [];

  const scenes: Scene[] = [];
  let currentMs = 200; // lead-in pause

  for (let idx = 0; idx < sentences.length; idx++) {
    const sentence = sentences[idx];
    const words = sentence.split(/\s+/).filter(Boolean);
    const durationMs = (words.length / wordsPerSecond) * 1000;
    const startMs = currentMs;
    const endMs = currentMs + durationMs;

    const keyWords = extractKeyWords(sentence, 4, keyTerms);

    // Generate timing for each key word — evenly spaced across the scene
    const kwDuration = durationMs / Math.max(keyWords.length, 1);
    const wordTimings = keyWords.map((word, i) => ({
      word,
      startMs: Math.round(startMs + i * kwDuration),
      endMs: Math.round(startMs + (i + 1) * kwDuration),
    }));

    scenes.push({
      sceneIndex: idx,
      sentence,
      keyWords,
      startMs: Math.round(startMs),
      endMs: Math.round(endMs),
      wordTimings,
    });

    currentMs = endMs;
  }

  return scenes;
}

// === Legacy caption system (kept for compatibility) ===

export function generateCaptionData(
  content: string,
  wordsPerSecond = 2.8
): Caption[] {
  const words = content.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  const msPerWord = 1000 / wordsPerSecond;
  const captions: Caption[] = [];

  let currentMs = 200;

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

export function getSegmentDurationInFrames(
  content: string,
  fps: number,
  wordsPerSecond = 3.2
): number {
  const words = content.split(/\s+/).filter(Boolean).length;
  const durationSec = words / wordsPerSecond + 1.5;
  return Math.ceil(durationSec * fps);
}
