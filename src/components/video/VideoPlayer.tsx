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
}

const FPS = 30;
const WIDTH = 1080;
const HEIGHT = 1920;

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  segment,
  mode,
  onComplete,
  isPaused,
}) => {
  const playerRef = useRef<PlayerRef>(null);

  const durationInFrames = useMemo(
    () => getSegmentDurationInFrames(segment.content, FPS),
    [segment.content]
  );

  const inputProps: LessonVideoCompositionProps = useMemo(
    () => ({
      segment,
      mode,
    }),
    [segment, mode]
  );

  // Handle pause/resume from parent (e.g., quiz gates)
  useEffect(() => {
    if (!playerRef.current) return;
    if (isPaused) {
      playerRef.current.pause();
    } else {
      playerRef.current.play();
    }
  }, [isPaused]);

  // Listen for video end
  const handleEnded = useCallback(() => {
    onComplete();
  }, [onComplete]);

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
        style={{
          width: "100%",
          maxWidth: 420,
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
