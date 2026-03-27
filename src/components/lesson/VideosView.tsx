"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Loader2 } from "lucide-react";
import type { LessonManifest } from "@/lib/types";
import type { ResolvedSegmentResources } from "@/lib/media-types";
import { updateLessonProgress, recordStudySession } from "@/lib/lesson-store";
import { useMediaResolver } from "@/hooks/useMediaResolver";

type VideoMode = "brainrot" | "fireship" | "aistory" | "whiteboard";

interface VideosViewProps {
  manifest: LessonManifest;
}

export function VideosView({ manifest }: VideosViewProps) {
  const [mode, setMode] = useState<VideoMode>("brainrot");
  const [currentSegment, setCurrentSegment] = useState(0);
  const [cauldronResources, setCauldronResources] = useState<Record<string, ResolvedSegmentResources>>({});

  // Shared media pipeline (replaces ~170 lines of duplicated inline code)
  const {
    enrichedManifest,
    sceneImages,
    mediaLoading,
    loadingStep,
    imagesLoading,
    imageProgress,
  } = useMediaResolver(manifest, { autoLoadImages: true });

  const enrichedSegments = enrichedManifest.segments;

  // Record study session + track segment views
  useEffect(() => { recordStudySession(); }, []);
  useEffect(() => {
    updateLessonProgress(manifest.id, enrichedSegments[currentSegment]?.id);
  }, [currentSegment, manifest.id, enrichedSegments]);

  // Scout cauldron resources (GIFs, characters, Lotties, memes)
  useEffect(() => {
    if (mediaLoading) return;

    let cancelled = false;
    (async () => {
      const scoutResults: Record<string, ResolvedSegmentResources> = {};
      const scoutPromises = manifest.segments.map(async (seg) => {
        try {
          const res = await fetch("/api/media/scout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ segment: seg, subject: manifest.subject }),
          });
          if (res.ok) {
            const data = await res.json();
            scoutResults[seg.id] = data;
          }
        } catch { /* Graceful */ }
      });
      await Promise.all(scoutPromises);
      if (!cancelled) setCauldronResources(scoutResults);
    })();

    return () => { cancelled = true; };
  }, [manifest, mediaLoading]);

  const handleVideoComplete = useCallback(() => {
    if (currentSegment < manifest.segments.length - 1) {
      setCurrentSegment((prev) => prev + 1);
    }
  }, [currentSegment, manifest.segments.length]);

  const segment = enrichedSegments[currentSegment];

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Mode selector */}
      <div className="flex gap-2 flex-wrap justify-center">
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
        <Button
          variant={mode === "aistory" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("aistory")}
          className="gap-1.5"
        >
          <Brain className="w-4 h-4" />
          AI Story
        </Button>
        <Button
          variant={mode === "whiteboard" ? "default" : "outline"}
          size="sm"
          onClick={() => setMode("whiteboard")}
          className="gap-1.5"
        >
          <FileText className="w-4 h-4" />
          Whiteboard
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
