import React from "react";
import { OffthreadVideo, useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";
import type { OverlayPosition } from "@/lib/media-types";

interface GifOverlayProps {
  gifUrl?: string;
  position?: OverlayPosition;
  mode: "brainrot" | "fireship";
  /** Frame when the GIF should appear */
  showFromFrame?: number;
  /** Duration in frames to show the GIF */
  durationFrames?: number;
}

const POSITION_STYLES: Record<OverlayPosition, React.CSSProperties> = {
  "top-left": { top: "8%", left: "4%" },
  "top-right": { top: "8%", right: "4%" },
  "bottom-left": { bottom: "18%", left: "4%" },
  "bottom-right": { bottom: "18%", right: "4%" },
  "center": { top: "30%", left: "50%", transform: "translateX(-50%)" },
};

export const GifOverlay: React.FC<GifOverlayProps> = ({
  gifUrl,
  position = "top-right",
  mode,
  showFromFrame = 15,
  durationFrames = 75, // ~2.5 seconds at 30fps
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!gifUrl) return null;

  const relativeFrame = frame - showFromFrame;
  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  // Spring entrance
  const entranceScale = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 8, mass: 0.3, stiffness: 300 },
  });

  // Fade out near the end
  const fadeOut = interpolate(
    relativeFrame,
    [durationFrames - 15, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Subtle wiggle
  const wiggle = Math.sin(relativeFrame * 0.15) * 2;

  // Mode-specific styling
  const size = mode === "brainrot" ? 200 : 140;
  const borderRadius = mode === "fireship" ? 12 : 16;
  const border = mode === "fireship"
    ? "2px solid rgba(255,255,255,0.1)"
    : "3px solid rgba(255,255,255,0.2)";

  const posStyle = POSITION_STYLES[position];

  return (
    <div
      style={{
        position: "absolute",
        ...posStyle,
        width: size,
        height: size,
        borderRadius,
        overflow: "hidden",
        transform: `scale(${entranceScale}) rotate(${wiggle}deg)`,
        opacity: fadeOut,
        boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
        border,
        zIndex: 8,
        ...(mode === "fireship" ? { backgroundColor: "rgba(0,0,0,0.6)" } : {}),
      }}
    >
      <OffthreadVideo
        src={gifUrl}
        muted
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />
    </div>
  );
};
