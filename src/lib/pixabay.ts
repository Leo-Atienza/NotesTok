import type {
  PixabayVideo,
  PixabayPhoto,
  PixabayVideoSearchResponse,
  PixabayPhotoSearchResponse,
} from "./media-types";

const PIXABAY_BASE = "https://pixabay.com/api";

export function isPixabayConfigured(): boolean {
  return !!process.env.PIXABAY_API_KEY;
}

/**
 * Search for videos via Pixabay API.
 * Free tier: 100 requests/min. No attribution required.
 */
export async function searchVideos(
  query: string,
  opts: { perPage?: number; page?: number } = {}
): Promise<PixabayVideo[]> {
  if (!isPixabayConfigured()) return [];

  const { perPage = 5, page = 1 } = opts;
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: query,
    per_page: String(perPage),
    page: String(page),
    safesearch: "true",
  });

  try {
    const res = await fetch(`${PIXABAY_BASE}/videos/?${params}`);
    if (!res.ok) return [];
    const data: PixabayVideoSearchResponse = await res.json();
    return data.hits ?? [];
  } catch {
    return [];
  }
}

/**
 * Search for photos via Pixabay API.
 * Free tier: 100 requests/min. No attribution required.
 */
export async function searchPhotos(
  query: string,
  opts: { perPage?: number; page?: number; orientation?: "horizontal" | "vertical" } = {}
): Promise<PixabayPhoto[]> {
  if (!isPixabayConfigured()) return [];

  const { perPage = 5, page = 1, orientation = "vertical" } = opts;
  const params = new URLSearchParams({
    key: process.env.PIXABAY_API_KEY!,
    q: query,
    per_page: String(perPage),
    page: String(page),
    orientation,
    safesearch: "true",
    image_type: "photo",
  });

  try {
    const res = await fetch(`${PIXABAY_BASE}/?${params}`);
    if (!res.ok) return [];
    const data: PixabayPhotoSearchResponse = await res.json();
    return data.hits ?? [];
  } catch {
    return [];
  }
}

/**
 * Pick the best video file from a Pixabay video.
 * Prefers medium quality for balance of size and clarity.
 */
export function pickBestVideoFile(video: PixabayVideo): { url: string; width: number; height: number } | null {
  const medium = video.videos.medium;
  if (medium?.url) return { url: medium.url, width: medium.width, height: medium.height };

  const large = video.videos.large;
  if (large?.url) return { url: large.url, width: large.width, height: large.height };

  const small = video.videos.small;
  if (small?.url) return { url: small.url, width: small.width, height: small.height };

  return null;
}
