import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

interface BrainrotModeProps {
  segment: Segment;
}

// Different zoom/pan presets per scene to simulate camera angles
const CAMERA_PRESETS = [
  { scale: 1.15, x: 0, y: 0 },       // slight zoom center
  { scale: 1.3, x: -40, y: -20 },     // zoom upper left
  { scale: 1.25, x: 30, y: -15 },     // zoom upper right
  { scale: 1.35, x: -20, y: 30 },     // zoom lower left
  { scale: 1.2, x: 25, y: 25 },       // zoom lower right
  { scale: 1.4, x: 0, y: -30 },       // zoom top center
  { scale: 1.3, x: 0, y: 35 },        // zoom bottom center
];

// Animated gradient fallback colors
const GRADIENT_SETS = [
  ["#0f0c29", "#302b63", "#24243e"],
  ["#1a1a2e", "#16213e", "#0f3460"],
  ["#0a192f", "#172a45", "#1d3557"],
  ["#1b0033", "#300050", "#4a0072"],
  ["#001219", "#005f73", "#0a9396"],
];

export const BrainrotMode: React.FC<BrainrotModeProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content);
  const hasImage = !!segment.imageUrl;

  // --- Progress bar ---
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // --- Title animation (first ~50 frames, then fades) ---
  const titleEntryOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleSlide = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const titleY = interpolate(titleSlide, [0, 1], [-40, 0]);
  const titleExitOpacity = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;
  const emojiScale = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });

  // --- Determine current scene for camera angle ---
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }
  const camera = CAMERA_PRESETS[currentSceneIndex % CAMERA_PRESETS.length];

  // Smooth interpolation toward target camera position
  const targetScale = camera.scale;
  const targetX = camera.x;
  const targetY = camera.y;
  // Use slow drift toward target for smooth transitions
  const drift = 0.03; // how fast camera moves per frame
  const sceneProgress = Math.min(
    (frame - Math.round((scenes[currentSceneIndex]?.startMs ?? 0) / 1000 * fps)) * drift,
    1
  );

  // Gradient fallback
  const gradientSet = GRADIENT_SETS[currentSceneIndex % GRADIENT_SETS.length];
  const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Full-screen background image with per-scene camera */}
      {hasImage ? (
        <AbsoluteFill
          style={{
            transform: `scale(${1 + (targetScale - 1) * sceneProgress}) translate(${targetX * sceneProgress}px, ${targetY * sceneProgress}px)`,
            overflow: "hidden",
          }}
        >
          <Img
            src={segment.imageUrl!}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </AbsoluteFill>
      ) : (
        <AbsoluteFill
          style={{
            background: `linear-gradient(${gradientAngle}deg, ${gradientSet[0]}, ${gradientSet[1]}, ${gradientSet[2]})`,
          }}
        />
      )}

      {/* Layer 2: Dark vignette for text readability */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Layer 3: Title (first ~2 seconds only) */}
      {frame < 55 && (
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 72,
              transform: `scale(${emojiScale})`,
              display: "inline-block",
              filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.6))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#fff",
              fontSize: 32,
              fontWeight: 800,
              textAlign: "center",
              margin: "10px 28px 0",
              textShadow:
                "2px 2px 0 rgba(0,0,0,0.9), -2px -2px 0 rgba(0,0,0,0.9), " +
                "0 3px 8px rgba(0,0,0,0.7)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {segment.title}
          </h2>
        </div>
      )}

      {/* Layer 4: Scene-based big text + subtitle */}
      <AnimatedCaptions scenes={scenes} style="brainrot" />

      {/* Layer 5: Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          width: `${progressWidth}%`,
          backgroundColor: "#22c55e",
          borderRadius: "0 2px 2px 0",
          zIndex: 10,
        }}
      />

      {/* Layer 6: Segment counter */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          right: "4%",
          padding: "6px 14px",
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.5)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          zIndex: 10,
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};
