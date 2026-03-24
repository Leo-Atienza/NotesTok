// === Media Asset Database Types ===

export type AssetType = "video" | "photo" | "music" | "sfx" | "overlay";
export type AssetMood = "dramatic" | "calm" | "energetic" | "dark" | "uplifting" | "tech" | "playful";
export type AssetEnergy = "low" | "medium" | "high";
export type AssetOrientation = "portrait" | "landscape" | "square";
export type AssetSource = "manual" | "pexels" | "pixabay" | "generated" | "elevenlabs";

export interface MediaAsset {
  id: string;
  type: AssetType;
  storageUrl: string;
  thumbnailUrl?: string;
  fileSize: number;
  format: string;
  duration?: number;
  width?: number;
  height?: number;
  subjects: string[];
  moods: AssetMood[];
  energy: AssetEnergy;
  tags: string[];
  colors: string[];
  orientation?: AssetOrientation;
  source: AssetSource;
  sourceId?: string;
  attribution?: string;
  license: string;
  loopable: boolean;
  usageCount: number;
  createdAt: Date;
}

export interface MediaQuery {
  type: AssetType;
  subjects?: string[];
  moods?: AssetMood[];
  tags?: string[];
  orientation?: AssetOrientation;
  loopable?: boolean;
  limit?: number;
}

export interface VoiceoverCacheEntry {
  id: string;
  textHash: string;
  text: string;
  voiceId: string;
  audioUrl: string;
  durationMs: number;
  createdAt: Date;
}

// === Pexels API Response Types ===

export interface PexelsVideoFile {
  id: number;
  quality: string;
  file_type: string;
  width: number;
  height: number;
  fps: number;
  link: string;
}

export interface PexelsVideo {
  id: number;
  width: number;
  height: number;
  duration: number;
  url: string;
  image: string;
  user: { name: string; url: string };
  video_files: PexelsVideoFile[];
}

export interface PexelsPhotoSrc {
  original: string;
  large2x: string;
  large: string;
  medium: string;
  small: string;
  portrait: string;
  landscape: string;
  tiny: string;
}

export interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  src: PexelsPhotoSrc;
  alt: string;
}

export interface PexelsVideoSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  videos: PexelsVideo[];
}

export interface PexelsPhotoSearchResponse {
  page: number;
  per_page: number;
  total_results: number;
  photos: PexelsPhoto[];
}
