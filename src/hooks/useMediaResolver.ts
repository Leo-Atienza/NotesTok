"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { LessonManifest, Segment } from "@/lib/types";
import { DEMO_LESSON_ID } from "@/lib/demo-lesson";
import { getDemoImages } from "@/lib/demo-images";
import { getLessonImages, saveLessonImages } from "@/lib/lesson-store";

export interface MediaResolverResult {
  /** The manifest with stock media, voiceover, and music attached to segments */
  enrichedManifest: LessonManifest;
  /** Per-segment AI-generated scene images: segmentId → array of URLs */
  sceneImages: Record<string, string[]>;
  /** True while the media pipeline is running */
  mediaLoading: boolean;
  /** Human-readable description of what's currently loading */
  loadingStep: string;
  /** True while AI images are being generated */
  imagesLoading: boolean;
  /** Progress counter for AI image generation */
  imageProgress: { done: number; total: number };
  /** Trigger images generation manually (e.g. when tab becomes active) */
  loadImages: () => Promise<void>;
}

/**
 * Shared media resolution pipeline. Handles:
 *   1. Stock video/photo resolution (Pexels/Pixabay/Firestore)
 *   2. Voiceover generation (ElevenLabs)
 *   3. AI image generation (Gemini) as fallback
 *
 * Used by both LessonPlayer (video modes) and VideosView (lesson tabs).
 */
export function useMediaResolver(
  manifest: LessonManifest,
  options: {
    /** Skip phases 1+2 (stock media + voiceover). Classic mode uses Web Speech. */
    skipMediaResolve?: boolean;
    /** Automatically load AI images on mount */
    autoLoadImages?: boolean;
    /** Video mode — passed to media resolve for mode-specific queries */
    mode?: "brainrot" | "fireship" | "aistory" | "whiteboard" | "classic";
  } = {}
): MediaResolverResult {
  const { skipMediaResolve = false, autoLoadImages = false, mode } = options;

  const [enrichedManifest, setEnrichedManifest] = useState<LessonManifest>(manifest);
  const [sceneImages, setSceneImages] = useState<Record<string, string[]>>({});
  const [mediaLoading, setMediaLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });
  const resolvedRef = useRef(false);

  // Phase 1+2: Resolve stock media + voiceover
  useEffect(() => {
    if (skipMediaResolve) return;
    if (manifest.id === DEMO_LESSON_ID) return;
    if (resolvedRef.current) return;

    let cancelled = false;
    resolvedRef.current = true;
    setMediaLoading(true);

    (async () => {
      const updated = manifest.segments.map((s) => ({ ...s }));
      const updatedManifest = { ...manifest, segments: updated };

      // Phase 1: Resolve stock media
      setLoadingStep("Finding visual materials...");
      try {
        const mediaRes = await fetch("/api/media/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: manifest.segments.map((s) => ({
              id: s.id,
              keyTerms: s.keyTerms,
              title: s.title,
              type: s.type,
            })),
            subject: manifest.subject,
            mode: mode && mode !== "classic" ? mode : undefined,
          }),
        });
        const mediaData = await mediaRes.json();

        if (!cancelled && mediaData.segmentMedia) {
          for (const seg of updated) {
            const media = mediaData.segmentMedia[seg.id];
            if (!media) continue;
            if (media.videos?.[0]?.url) seg.backgroundVideoUrl = media.videos[0].url;
            if (media.photos?.[0]?.url) seg.backgroundPhotoUrl = media.photos[0].url;
            if (media.photos?.length > 1) {
              seg.scenePhotoUrls = media.photos.map((p: { url: string }) => p.url);
            }
            if (media.memeUrl) seg.scoutedMemeUrl = media.memeUrl;
            if (media.sfxUrl) seg.sfxUrl = media.sfxUrl;
          }
          if (mediaData.music) updatedManifest.backgroundMusicUrl = mediaData.music;
          if (mediaData.sfx) updatedManifest.transitionSfxUrl = mediaData.sfx;
        }
      } catch {
        // Graceful — continue without stock media
      }

      // Phase 2: Generate voiceover
      setLoadingStep("Generating voiceover...");
      try {
        const voRes = await fetch("/api/media/voiceover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: manifest.segments.map((s) => ({
              id: s.id,
              content: s.content,
            })),
          }),
        });
        const voData = await voRes.json();

        if (!cancelled && voData.voiceovers) {
          for (const seg of updated) {
            const vo = voData.voiceovers[seg.id];
            if (vo) {
              seg.voiceoverUrl = vo.audioUrl;
              seg.voiceoverTimings = vo.wordTimings;
            }
          }
        }
      } catch {
        // Graceful — falls back to Web Speech
      }

      // Phase 3: Gemini images for segments without stock media
      setLoadingStep("Preparing visuals...");
      for (const segment of updated) {
        if (cancelled) break;
        if (segment.backgroundVideoUrl || segment.backgroundPhotoUrl) continue;

        const prompts = segment.sceneImagePrompts;
        if (prompts && prompts.length > 0) {
          const batchSize = 3;
          for (let i = 0; i < prompts.length; i += batchSize) {
            const batch = prompts.slice(i, i + batchSize);
            const results = await Promise.allSettled(
              batch.map((prompt) =>
                fetch("/api/generate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt }),
                }).then((r) => r.json())
              )
            );
            const newUrls: string[] = [];
            for (const result of results) {
              if (result.status === "fulfilled" && result.value.imageUrl) {
                newUrls.push(result.value.imageUrl);
              }
            }
            if (newUrls.length > 0) {
              setSceneImages((prev) => ({
                ...prev,
                [segment.id]: [...(prev[segment.id] || []), ...newUrls],
              }));
            }
          }
          await new Promise((r) => setTimeout(r, 800));
        } else if (segment.imagePrompt) {
          try {
            const res = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: segment.imagePrompt }),
            });
            const data = await res.json();
            if (data.imageUrl) {
              setSceneImages((prev) => ({
                ...prev,
                [segment.id]: [data.imageUrl],
              }));
            }
          } catch {
            /* Graceful fallback */
          }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      if (!cancelled) {
        updatedManifest.segments = updated;
        setEnrichedManifest(updatedManifest);
        setMediaLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest.id, skipMediaResolve]);

  // Standalone AI image loader (for VideosView tab)
  const loadImages = useCallback(async () => {
    if (Object.keys(sceneImages).length > 0) return;

    // Demo mode — use pre-baked images
    if (manifest.id === DEMO_LESSON_ID) {
      setSceneImages(getDemoImages());
      return;
    }

    // Check stored images first
    const stored = getLessonImages(manifest.id);
    if (stored && Object.keys(stored).length > 0) {
      setSceneImages(stored);
      return;
    }

    // Generate images
    setImagesLoading(true);
    const allImages: Record<string, string[]> = {};
    const totalPrompts = manifest.segments.reduce(
      (acc, seg) => acc + (seg.sceneImagePrompts?.length || (seg.imagePrompt ? 1 : 0)),
      0
    );
    setImageProgress({ done: 0, total: totalPrompts });

    let doneCount = 0;

    for (const segment of manifest.segments) {
      const prompts =
        segment.sceneImagePrompts || (segment.imagePrompt ? [segment.imagePrompt] : []);
      if (prompts.length === 0) continue;

      const images: string[] = [];
      const toLoad = prompts.slice(0, 3);

      for (const prompt of toLoad) {
        try {
          const res = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt }),
          });
          const data = await res.json();
          if (data.imageUrl) {
            images.push(data.imageUrl);
          }
        } catch {
          // Skip failed images
        }
        doneCount++;
        setImageProgress({ done: doneCount, total: totalPrompts });
      }

      if (images.length > 0) {
        allImages[segment.id] = images;
      }
    }

    setSceneImages(allImages);
    setImagesLoading(false);

    // Persist for page refresh
    if (Object.keys(allImages).length > 0) {
      saveLessonImages(manifest.id, allImages);
    }
  }, [manifest, sceneImages]);

  // Auto-load images on mount if requested
  useEffect(() => {
    if (autoLoadImages) {
      loadImages();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoadImages, manifest.id]);

  return {
    enrichedManifest,
    sceneImages,
    mediaLoading,
    loadingStep,
    imagesLoading,
    imageProgress,
    loadImages,
  };
}
