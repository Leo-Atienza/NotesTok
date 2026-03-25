"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Loader2 } from "lucide-react";
import type { LessonManifest, Segment } from "@/lib/types";
import type { ResolvedSegmentResources } from "@/lib/media-types";
import { DEMO_LESSON_ID } from "@/lib/demo-lesson";
import { getDemoImages } from "@/lib/demo-images";
import { getLessonImages, saveLessonImages } from "@/lib/lesson-store";

type VideoMode = "brainrot" | "fireship";

interface VideosViewProps {
  manifest: LessonManifest;
}

export function VideosView({ manifest }: VideosViewProps) {
  const [mode, setMode] = useState<VideoMode>("brainrot");
  const [currentSegment, setCurrentSegment] = useState(0);
  const [sceneImages, setSceneImages] = useState<Record<string, string[]>>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [imageProgress, setImageProgress] = useState({ done: 0, total: 0 });
  const [enrichedSegments, setEnrichedSegments] = useState<Segment[]>(manifest.segments);
  const [enrichedManifest, setEnrichedManifest] = useState<LessonManifest>(manifest);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [cauldronResources, setCauldronResources] = useState<Record<string, ResolvedSegmentResources>>({});

  // Resolve stock media + voiceover on mount
  useEffect(() => {
    if (manifest.id === DEMO_LESSON_ID) return; // Demo uses pre-baked images

    let cancelled = false;

    (async () => {
      setMediaLoading(true);
      const updated = manifest.segments.map((s) => ({ ...s }));
      const updatedManifest = { ...manifest, segments: updated };

      // Phase 1: Resolve stock media
      setLoadingStep("Finding stock media...");
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
            segments: manifest.segments.map((s) => ({ id: s.id, content: s.content })),
          }),
        });
        const voData = await voRes.json();

        if (!cancelled && voData.voiceovers) {
          for (const seg of updated) {
            const voUrl = voData.voiceovers[seg.id];
            if (voUrl) seg.voiceoverUrl = voUrl;
          }
        }
      } catch {
        // Graceful — falls back to Web Speech
      }

      // Phase 3: Scout cauldron resources (GIFs, characters, Lotties, memes)
      setLoadingStep("Scouting visual assets...");
      try {
        const scoutResults: Record<string, ResolvedSegmentResources> = {};
        // Scout each segment in parallel (fire all requests)
        const scoutPromises = manifest.segments.map(async (seg) => {
          try {
            const res = await fetch("/api/media/scout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                segment: seg,
                subject: manifest.subject,
              }),
            });
            if (res.ok) {
              const data = await res.json();
              scoutResults[seg.id] = data;
            }
          } catch {
            // Graceful — continue without cauldron resources for this segment
          }
        });
        await Promise.all(scoutPromises);

        if (!cancelled) {
          setCauldronResources(scoutResults);
        }
      } catch {
        // Graceful — videos still work without cauldron resources
      }

      if (!cancelled) {
        updatedManifest.segments = updated;
        setEnrichedSegments(updated);
        setEnrichedManifest(updatedManifest);
        setMediaLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [manifest]);

  // Load Gemini images on mount (fallback for segments without stock media)
  useEffect(() => {
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
    loadImages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest.id]);

  const loadImages = useCallback(async () => {
    setImagesLoading(true);
    const allImages: Record<string, string[]> = {};
    const totalPrompts = manifest.segments.reduce(
      (acc, seg) => acc + (seg.sceneImagePrompts?.length || (seg.imagePrompt ? 1 : 0)),
      0
    );
    setImageProgress({ done: 0, total: totalPrompts });

    let doneCount = 0;

    for (const segment of manifest.segments) {
      const prompts = segment.sceneImagePrompts || (segment.imagePrompt ? [segment.imagePrompt] : []);
      if (prompts.length === 0) continue;

      const images: string[] = [];
      // Load up to 3 images per segment
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
  }, [manifest]);

  const handleVideoComplete = useCallback(() => {
    if (currentSegment < manifest.segments.length - 1) {
      setCurrentSegment((prev) => prev + 1);
    }
  }, [currentSegment, manifest.segments.length]);

  const segment = enrichedSegments[currentSegment];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode selector */}
      <div className="flex gap-2">
        <Button
          variant={mode === "brainrot" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("brainrot")}
          className="gap-1.5"
        >
          <Brain className="w-4 h-4" />
          Brainrot
        </Button>
        <Button
          variant={mode === "fireship" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("fireship")}
          className="gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Fireship
        </Button>
      </div>

      {/* Media loading progress */}
      {mediaLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>{loadingStep}</span>
        </div>
      )}

      {/* Image loading progress */}
      {imagesLoading && !mediaLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>
            Generating visuals... {imageProgress.done}/{imageProgress.total}
          </span>
        </div>
      )}

      {/* Segment navigation */}
      <div className="flex gap-2 flex-wrap justify-center">
        {manifest.segments.map((seg, i) => (
          <button
            key={seg.id}
            onClick={() => setCurrentSegment(i)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              i === currentSegment
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {seg.emoji} {seg.title}
          </button>
        ))}
      </div>

      {/* Video player */}
      <div className="w-full max-w-[400px]">
        <VideoPlayer
          key={`${segment.id}-${mode}`}
          segment={segment}
          mode={mode}
          onComplete={handleVideoComplete}
          sceneImages={sceneImages[segment.id] || []}
          voiceoverUrl={segment.voiceoverUrl}
          backgroundMusicUrl={enrichedManifest.backgroundMusicUrl}
          transitionSfxUrl={enrichedManifest.transitionSfxUrl}
          cauldronResources={cauldronResources[segment.id]}
        />
      </div>

      {/* Segment info */}
      <div className="text-center space-y-1">
        <Badge variant="secondary" className="text-xs">
          {currentSegment + 1} of {manifest.segments.length}
        </Badge>
        <p className="text-sm text-muted-foreground max-w-md">
          {segment.title}
        </p>
      </div>
    </div>
  );
}
