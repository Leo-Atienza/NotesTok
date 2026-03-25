// === Media Asset Database Types ===

export type AssetType = "video" | "photo" | "music" | "sfx" | "overlay" | "gif" | "lottie" | "sticker" | "character";
export type AssetMood = "dramatic" | "calm" | "energetic" | "dark" | "uplifting" | "tech" | "playful";
export type AssetEnergy = "low" | "medium" | "high";
export type AssetOrientation = "portrait" | "landscape" | "square";
export type AssetSource = "manual" | "pexels" | "pixabay" | "klipy" | "lottiefiles" | "openmoji" | "generated" | "elevenlabs";

// --- GIF assets (from Klipy API) ---
export type GifCategory = "reaction" | "meme" | "educational" | "transition";
export type GifEmotion = "funny" | "shocked" | "excited" | "confused" | "mind-blown" | "sad" | "celebrating" | "facepalm";

export interface GifAsset extends MediaAsset {
  type: "gif";
  category: GifCategory;
  emotion?: GifEmotion;
}

// --- Lottie animation assets ---
export type LottieCategory = "transition" | "effect" | "icon" | "decoration" | "celebration" | "loading";

export interface LottieAsset extends MediaAsset {
  type: "lottie";
  lottieUrl: string;
  category: LottieCategory;
}

// --- Character assets (AI-generated poses) ---
export type CharacterId = "hoodie-student" | "glasses-nerd" | "cat-mascot";
export type CharacterPose = "explaining" | "shocked" | "pointing" | "celebrating" | "confused" | "facepalm" | "thumbs-up" | "mic-drop";

export interface CharacterAsset extends MediaAsset {
  type: "character";
  characterId: CharacterId;
  pose: CharacterPose;
}

// --- Sticker/emoji assets (OpenMoji SVGs) ---
export interface StickerAsset extends MediaAsset {
  type: "sticker";
  emojiCode: string;
  svgUrl: string;
}

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

// === Klipy API Response Types ===

export interface KlipyGif {
  id: string;
  title: string;
  url: string;
  preview: string;
  mp4: string;
  width: number;
  height: number;
  duration?: number;
}

export interface KlipySearchResponse {
  results: KlipyGif[];
  next?: string;
}

// === Pixabay API Response Types ===

export interface PixabayVideo {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  duration: number;
  videos: {
    large: { url: string; width: number; height: number; size: number };
    medium: { url: string; width: number; height: number; size: number };
    small: { url: string; width: number; height: number; size: number };
    tiny: { url: string; width: number; height: number; size: number };
  };
  user: string;
  userImageURL: string;
}

export interface PixabayPhoto {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  user: string;
  userImageURL: string;
}

export interface PixabayVideoSearchResponse {
  total: number;
  totalHits: number;
  hits: PixabayVideo[];
}

export interface PixabayPhotoSearchResponse {
  total: number;
  totalHits: number;
  hits: PixabayPhoto[];
}

// === Resource Scout Types ===

export type OverlayPosition = "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";

export interface SceneResourcePlan {
  sceneIndex: number;
  sentence: string;
  backgroundQuery: string;
  overlayGif?: {
    query: string;
    emotion: GifEmotion;
    position: OverlayPosition;
  };
  lottieEffect?: {
    category: LottieCategory;
    trigger: "scene-enter" | "scene-exit" | "keyword";
  };
  characterPose?: CharacterPose;
  stickerEmojis?: string[];
  memeText?: { top?: string; bottom?: string };
  povText?: string;
  humorNote?: string;
}

export interface ResourcePlan {
  segmentId: string;
  scenes: SceneResourcePlan[];
}

export interface ResolvedSceneResources {
  sceneIndex: number;
  backgroundUrl?: string;
  backgroundType?: "video" | "photo";
  gifUrl?: string;
  gifPosition?: OverlayPosition;
  lottieUrl?: string;
  characterImageUrl?: string;
  stickerUrls?: string[];
  memeText?: { top?: string; bottom?: string };
  povText?: string;
}

export interface ResolvedSegmentResources {
  segmentId: string;
  scenes: ResolvedSceneResources[];
}
