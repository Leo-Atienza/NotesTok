import type { KlipyGif, KlipySearchResponse } from "./media-types";

const KLIPY_BASE = "https://api.klipy.com/v1";

export function isKlipyConfigured(): boolean {
  return !!process.env.KLIPY_API_KEY;
}

function getHeaders(): HeadersInit {
  return {
    "Authorization": `Bearer ${process.env.KLIPY_API_KEY}`,
    "Content-Type": "application/json",
  };
}

/**
 * Search for GIFs via Klipy API.
 * Returns MP4 URLs which Remotion can render as <OffthreadVideo>.
 * Free tier: 100 requests/min.
 */
export async function searchGifs(
  query: string,
  opts: { limit?: number } = {}
): Promise<KlipyGif[]> {
  if (!isKlipyConfigured()) return [];

  const { limit = 5 } = opts;
  const params = new URLSearchParams({
    q: query,
    limit: String(limit),
    type: "gif",
  });

  try {
    const res = await fetch(`${KLIPY_BASE}/search?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data: KlipySearchResponse = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

/**
 * Search for reaction GIFs with emotion context.
 * Appends emotion keyword to query for more relevant results.
 */
export async function searchReactionGifs(
  query: string,
  emotion: string,
  limit = 3
): Promise<KlipyGif[]> {
  const emotionQuery = `${query} ${emotion}`;
  return searchGifs(emotionQuery, { limit });
}

/**
 * Get the best MP4 URL from a Klipy GIF result.
 * Klipy serves MP4 format natively which Remotion renders via <OffthreadVideo>.
 */
export function getGifMp4Url(gif: KlipyGif): string {
  return gif.mp4 || gif.url;
}
