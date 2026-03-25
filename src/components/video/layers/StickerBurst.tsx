import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface StickerBurstProps {
  stickerUrls?: string[];
  mode: "brainrot" | "fireship";
  /** Frame when stickers start flying in */
  showFromFrame?: number;
  /** Duration in frames */
  durationFrames?: number;
}

// Pre-computed random-ish positions for stickers
const STICKER_POSITIONS = [
  { startX: -20, startY: 110, endX: 25, endY: 35, rotate: 15 },
  { startX: 120, startY: 110, endX: 70, endY: 25, rotate: -20 },
  { startX: -20, startY: -10, endX: 40, endY: 50, rotate: 10 },
  { startX: 120, startY: -10, endX: 60, endY: 45, rotate: -15 },
  { startX: 50, startY: 120, endX: 50, endY: 30, rotate: 25 },
];

export const StickerBurst: React.FC<StickerBurstProps> = ({
  stickerUrls,
  mode,
  showFromFrame = 0,
  durationFrames = 45, // ~1.5 seconds
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!stickerUrls || stickerUrls.length === 0) return null;

  const relativeFrame = frame - showFromFrame;
  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  // Fade out at the end
  const fadeOut = interpolate(
    relativeFrame,
    [durationFrames - 12, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const stickerSize = mode === "brainrot" ? 80 : 56;

  return (
    <>
      {stickerUrls.slice(0, 5).map((url, i) => {
        const pos = STICKER_POSITIONS[i % STICKER_POSITIONS.length];
        const staggerDelay = i * 3; // 3 frames between each sticker

        const springProgress = spring({
          frame: Math.max(0, relativeFrame - staggerDelay),
          fps,
          config: { damping: 7, mass: 0.3, stiffness: 250 },
        });

        const x = interpolate(springProgress, [0, 1], [pos.startX, pos.endX]);
        const y = interpolate(springProgress, [0, 1], [pos.startY, pos.endY]);
        const scale = interpolate(springProgress, [0, 0.5, 1], [0, 1.3, 1]);
        const rotate = pos.rotate * springProgress;

        return (
          <div
            key={`sticker-${i}`}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: stickerSize,
              height: stickerSize,
              transform: `translate(-50%, -50%) scale(${scale}) rotate(${rotate}deg)`,
              opacity: fadeOut * (springProgress > 0.05 ? 1 : 0),
              zIndex: 9,
              pointerEvents: "none",
              filter: mode === "fireship" ? "brightness(0.8)" : "none",
            }}
          >
            <img
              src={url}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
          </div>
        );
      })}
    </>
  );
};
