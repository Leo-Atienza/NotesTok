"use client";

import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { Player, type PlayerRef } from "@remotion/player";
import {
  LessonVideoComposition,
  type LessonVideoCompositionProps,
} from "./LessonVideoComposition";
import { getSegmentDurationInFrames } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

// Remotion Player expects a loosely-typed component for its `component` prop
const CompositionComponent = LessonVideoComposition as unknown as React.FC<Record<string, unknown>>;

interface VideoPlayerProps {
  segment: Segment;
  mode: "brainrot" | "fireship";
  onComplete: () => void;
  isPaused?: boolean;
  sceneImages?: string[];
  voiceoverUrl?: string;
  backgroundMusicUrl?: string;
  transitionSfxUrl?: string;
}

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  segment,
  mode,
  onComplete,
  isPaused,
  sceneImages,
  voiceoverUrl,
  backgroundMusicUrl,
  transitionSfxUrl,
}) => {
  const playerRef = useRef<PlayerRef>(null);
  const voiceoverRef = useRef<HTMLAudioElement | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);

  const durationInFrames = useMemo(
    () => getSegmentDurationInFrames(segment.content, FPS),
    [segment.content]
  );

  const inputProps: LessonVideoCompositionProps = useMemo(
    () => ({
      segment,
      mode,
      sceneImages,
      backgroundVideoUrl: segment.backgroundVideoUrl,
      backgroundPhotoUrl: segment.backgroundPhotoUrl,
      scenePhotoUrls: segment.scenePhotoUrls,
    }),
    [segment, mode, sceneImages]
  );

  // Handle pause/resume from parent (e.g., quiz gates)
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPaused) {
      playerRef.current.pause();
      voiceoverRef.current?.pause();
      musicRef.current?.pause();
    } else {
      playerRef.current.play();
      voiceoverRef.current?.play();
      musicRef.current?.play();
    }
  }, [isPaused]);

  // Voiceover audio sync
  useEffect(() => {
    if (!voiceoverUrl) return;

    const audio = new Audio(voiceoverUrl);
    audio.volume = 1;
    voiceoverRef.current = audio;

    // Play when player starts
    const timer = setTimeout(() => {
      audio.play().catch(() => {});
    }, 200);

    audio.addEventListener("ended", () => {
      onComplete();
    });

    return () => {
      clearTimeout(timer);
      audio.pause();
      audio.removeAttribute("src");
      voiceoverRef.current = null;
    };
  }, [voiceoverUrl, onComplete]);

  // Background music
  useEffect(() => {
    if (!backgroundMusicUrl) return;

    const audio = new Audio(backgroundMusicUrl);
    audio.loop = true;
    audio.volume = voiceoverUrl ? 0.08 : 0.15; // Duck when voiceover active
    musicRef.current = audio;
    audio.play().catch(() => {});

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      musicRef.current = null;
    };
  }, [backgroundMusicUrl, voiceoverUrl]);

  // Listen for video end (only when no voiceover — voiceover handles completion)
  const handleEnded = useCallback(() => {
    if (!voiceoverUrl) {
      onComplete();
    }
  }, [onComplete, voiceoverUrl]);

  useEffect(() => {
    const player = playerRef.current;
    if (!player) return;

    player.addEventListener("ended", handleEnded);
    return () => {
      player.removeEventListener("ended", handleEnded);
    };
  }, [handleEnded]);

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div
        className="video-player-container"
        style={{
          width: "100%",
          aspectRatio: "9 / 16",
          borderRadius: 16,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}
      >
        <Player
          ref={playerRef}
          component={CompositionComponent}
          inputProps={inputProps}
          durationInFrames={durationInFrames}
          fps={FPS}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          autoPlay
          controls
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </div>
    </div>
  );
};
