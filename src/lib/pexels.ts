import type {
  PexelsVideo,
  PexelsPhoto,
  PexelsVideoFile,
  PexelsVideoSearchResponse,
  PexelsPhotoSearchResponse,
} from "./media-types";

const PEXELS_BASE = "https://api.pexels.com";

export function isPexelsConfigured(): boolean {
  return !!process.env.PEXELS_API_KEY;
}

function getHeaders(): HeadersInit {
  return { Authorization: process.env.PEXELS_API_KEY! };
}

export async function searchVideos(
  query: string,
  opts: { perPage?: number; page?: number } = {}
): Promise<PexelsVideo[]> {
  if (!isPexelsConfigured()) return [];

  const { perPage = 5, page = 1 } = opts;
  const params = new URLSearchParams({
    query,
    orientation: "portrait",
    size: "medium",
    per_page: String(perPage),
    page: String(page),
  });

  try {
    const res = await fetch(`${PEXELS_BASE}/videos/search?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data: PexelsVideoSearchResponse = await res.json();
    return data.videos ?? [];
  } catch {
    return [];
  }
}

export async function searchPhotos(
  query: string,
  opts: { perPage?: number; page?: number } = {}
): Promise<PexelsPhoto[]> {
  if (!isPexelsConfigured()) return [];

  const { perPage = 5, page = 1 } = opts;
  const params = new URLSearchParams({
    query,
    orientation: "portrait",
    size: "large",
    per_page: String(perPage),
    page: String(page),
  });

  try {
    const res = await fetch(`${PEXELS_BASE}/v1/search?${params}`, {
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const data: PexelsPhotoSearchResponse = await res.json();
    return data.photos ?? [];
  } catch {
    return [];
  }
}

/** Pick the best portrait HD MP4 file from a Pexels video */
export function pickBestVideoFile(video: PexelsVideo): PexelsVideoFile | null {
  const mp4Files = video.video_files.filter(
    (f) => f.file_type === "video/mp4"
  );
  if (mp4Files.length === 0) return null;

  // Prefer portrait (height > width), HD quality
  const portrait = mp4Files.filter((f) => f.height > f.width);
  const pool = portrait.length > 0 ? portrait : mp4Files;

  // Sort by quality: prefer 720-1080px width range
  const sorted = [...pool].sort((a, b) => {
    const aScore = a.width >= 720 && a.width <= 1920 ? 1 : 0;
    const bScore = b.width >= 720 && b.width <= 1920 ? 1 : 0;
    if (aScore !== bScore) return bScore - aScore;
    // Among qualified, prefer higher resolution
    return b.width - a.width;
  });

  return sorted[0] ?? null;
}
