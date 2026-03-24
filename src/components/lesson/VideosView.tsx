"use client";

import { useState, useEffect, useCallback } from "react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, FileText, Loader2 } from "lucide-react";
import type { LessonManifest } from "@/lib/types";
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

  // Load images on mount
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

  const segment = manifest.segments[currentSegment];

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

      {/* Image loading progress */}
      {imagesLoading && (
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
