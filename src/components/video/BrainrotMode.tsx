import React from "react";
import {
  AbsoluteFill,
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
  sceneImages?: string[];
}

// Camera presets for image zoom/pan
const CAMERA_PRESETS = [
  { scale: 1.15, x: 0, y: 0 },
  { scale: 1.3, x: -40, y: -20 },
  { scale: 1.25, x: 30, y: -15 },
  { scale: 1.35, x: -20, y: 30 },
  { scale: 1.2, x: 25, y: 25 },
  { scale: 1.4, x: 0, y: -30 },
];

// Vibrant scene color themes — each scene gets a distinct look
const SCENE_THEMES = [
  { bg: ["#7c3aed", "#4f46e5", "#6d28d9"], accent: "#a78bfa", glow: "rgba(139,92,246,0.4)" },
  { bg: ["#db2777", "#e11d48", "#be185d"], accent: "#f472b6", glow: "rgba(244,114,182,0.4)" },
  { bg: ["#0891b2", "#0e7490", "#155e75"], accent: "#22d3ee", glow: "rgba(34,211,238,0.4)" },
  { bg: ["#ea580c", "#dc2626", "#c2410c"], accent: "#fb923c", glow: "rgba(251,146,60,0.4)" },
  { bg: ["#059669", "#047857", "#065f46"], accent: "#34d399", glow: "rgba(52,211,153,0.4)" },
  { bg: ["#7c3aed", "#be185d", "#4f46e5"], accent: "#c084fc", glow: "rgba(192,132,252,0.4)" },
  { bg: ["#2563eb", "#1d4ed8", "#1e40af"], accent: "#60a5fa", glow: "rgba(96,165,250,0.4)" },
];

// Floating shape configs — circles/blobs that drift around
const SHAPES = [
  { size: 280, xBase: 15, yBase: 20, speed: 0.008, phase: 0, opacity: 0.15 },
  { size: 200, xBase: 75, yBase: 60, speed: 0.012, phase: 2, opacity: 0.12 },
  { size: 340, xBase: 50, yBase: 80, speed: 0.006, phase: 4, opacity: 0.1 },
  { size: 160, xBase: 85, yBase: 15, speed: 0.015, phase: 1, opacity: 0.18 },
  { size: 220, xBase: 25, yBase: 70, speed: 0.01, phase: 3, opacity: 0.13 },
];

export const BrainrotMode: React.FC<BrainrotModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, 2.8, segment.keyTerms);
  const hasSceneImages = sceneImages.length > 0;
  const hasSingleImage = !!segment.imageUrl;

  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Hook slide (first segment only)
  const isFirstSegment = segment.order === 0;
  const hookDuration = isFirstSegment ? 50 : 0;

  const hookFlash = interpolate(frame, [0, 2, 5], [0.6, 0.3, 0], {
    extrapolateRight: "clamp",
  });
  const hookEmojiScale = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 6, mass: 0.5, stiffness: 250 },
  });
  const hookTitleScale = spring({
    frame: Math.max(0, frame - 8),
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 200 },
  });
  const hookExitOpacity = isFirstSegment
    ? interpolate(frame, [hookDuration - 10, hookDuration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Title animation for non-first segments
  const titleEntryOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleSlide = spring({ frame, fps, config: { damping: 12, mass: 0.8 } });
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

  // Current scene
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }
  const camera = CAMERA_PRESETS[currentSceneIndex % CAMERA_PRESETS.length];
  const theme = SCENE_THEMES[currentSceneIndex % SCENE_THEMES.length];

  const sceneStartFrame = Math.round(
    ((scenes[currentSceneIndex]?.startMs ?? 0) / 1000) * fps
  );
  const sceneProgress = Math.min((frame - sceneStartFrame) * 0.03, 1);

  // Per-scene image selection
  const currentSceneImage =
    hasSceneImages && sceneImages[currentSceneIndex]
      ? sceneImages[currentSceneIndex]
      : hasSingleImage
        ? segment.imageUrl!
        : null;

  const prevSceneIndex = Math.max(0, currentSceneIndex - 1);
  const prevSceneImage =
    hasSceneImages && sceneImages[prevSceneIndex]
      ? sceneImages[prevSceneIndex]
      : null;

  const transitionProgress = interpolate(
    frame - sceneStartFrame,
    [0, 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Background gradient angle — slow rotation
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 225]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Layer 1: Background — images or vibrant gradients */}
      {currentSceneImage ? (
        <>
          {prevSceneImage &&
            prevSceneImage !== currentSceneImage &&
            transitionProgress < 1 && (
              <AbsoluteFill style={{ opacity: 1 - transitionProgress, overflow: "hidden" }}>
                <Img
                  src={prevSceneImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </AbsoluteFill>
            )}
          <AbsoluteFill
            style={{
              transform: `scale(${1 + (camera.scale - 1) * sceneProgress}) translate(${camera.x * sceneProgress}px, ${camera.y * sceneProgress}px)`,
              opacity:
                prevSceneImage && prevSceneImage !== currentSceneImage
                  ? transitionProgress
                  : 1,
              overflow: "hidden",
            }}
          >
            <Img
              src={currentSceneImage}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </>
      ) : (
        /* Vibrant gradient background */
        <AbsoluteFill
          style={{
            background: `linear-gradient(${gradientAngle}deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 50%, ${theme.bg[2]} 100%)`,
          }}
        />
      )}

      {/* Layer 2: Floating shapes (always visible, adds depth) */}
      {!currentSceneImage &&
        SHAPES.map((shape, i) => {
          const x =
            shape.xBase + Math.sin(frame * shape.speed + shape.phase) * 12;
          const y =
            shape.yBase + Math.cos(frame * shape.speed * 0.7 + shape.phase) * 8;
          const scale = 1 + Math.sin(frame * shape.speed * 0.5 + i) * 0.15;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${y}%`,
                width: shape.size,
                height: shape.size,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${theme.accent}${Math.round(shape.opacity * 255).toString(16).padStart(2, "0")} 0%, transparent 70%)`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                filter: "blur(40px)",
              }}
            />
          );
        })}

      {/* Layer 3: Subtle noise/grid overlay for texture */}
      {!currentSceneImage && (
        <AbsoluteFill
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(255,255,255,0.02) 3px, rgba(255,255,255,0.02) 4px)",
            mixBlendMode: "overlay",
          }}
        />
      )}

      {/* Layer 4: Vignette — softer, slightly colored */}
      <AbsoluteFill
        style={{
          background: currentSceneImage
            ? "radial-gradient(ellipse at center, rgba(0,0,0,0.25) 20%, rgba(0,0,0,0.7) 100%)"
            : `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.45) 100%)`,
        }}
      />

      {/* Layer 5: Floating emoji particles */}
      {!currentSceneImage &&
        [0, 1, 2].map((i) => {
          const baseY = 110 - ((frame * (0.4 + i * 0.15) + i * 40) % 130);
          const x = 15 + i * 30 + Math.sin(frame * 0.03 + i * 2) * 10;
          const particleOpacity = interpolate(
            baseY,
            [-10, 10, 80, 100],
            [0, 0.6, 0.6, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
          );
          const rotation = Math.sin(frame * 0.05 + i) * 15;
          return (
            <div
              key={`emoji-${i}`}
              style={{
                position: "absolute",
                left: `${x}%`,
                top: `${baseY}%`,
                fontSize: 48 + i * 12,
                opacity: particleOpacity * 0.5,
                transform: `rotate(${rotation}deg)`,
                filter: "blur(1px)",
                pointerEvents: "none",
              }}
            >
              {segment.emoji}
            </div>
          );
        })}

      {/* Layer 6: Hook slide (first segment dramatic intro) */}
      {isFirstSegment && frame < hookDuration && (
        <>
          {frame < 5 && (
            <AbsoluteFill
              style={{ backgroundColor: "#fff", opacity: hookFlash, zIndex: 15 }}
            />
          )}
          <AbsoluteFill
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              padding: "0 10%",
              opacity: frame < hookDuration - 10 ? 1 : hookExitOpacity,
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: 96,
                transform: `scale(${hookEmojiScale})`,
                display: "inline-block",
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.5))",
                marginBottom: 20,
              }}
            >
              {segment.emoji}
            </span>
            <h1
              style={{
                color: "#fff",
                fontSize: 52,
                fontWeight: 900,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                transform: `scale(${interpolate(hookTitleScale, [0, 1], [0.6, 1])})`,
                opacity: interpolate(hookTitleScale, [0, 1], [0, 1]),
                textShadow:
                  "4px 4px 0 rgba(0,0,0,0.9), -4px -4px 0 rgba(0,0,0,0.9), " +
                  "4px -4px 0 rgba(0,0,0,0.9), -4px 4px 0 rgba(0,0,0,0.9), " +
                  "0 6px 16px rgba(0,0,0,0.7)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                margin: 0,
              }}
            >
              {segment.title}
            </h1>
          </AbsoluteFill>
        </>
      )}

      {/* Layer 7: Regular title (non-first segments) */}
      {!isFirstSegment && frame < 55 && (
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
                "2px 2px 0 rgba(0,0,0,0.9), -2px -2px 0 rgba(0,0,0,0.9), 0 3px 8px rgba(0,0,0,0.7)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {segment.title}
          </h2>
        </div>
      )}

      {/* Layer 8: Scene-based captions */}
      <AnimatedCaptions scenes={scenes} style="brainrot" />

      {/* Layer 9: Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 5,
          width: `${progressWidth}%`,
          background: `linear-gradient(90deg, ${theme.accent}, #fff)`,
          borderRadius: "0 3px 3px 0",
          zIndex: 10,
          boxShadow: `0 0 12px ${theme.glow}`,
        }}
      />

      {/* Layer 10: Segment counter */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          right: "4%",
          padding: "6px 14px",
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          zIndex: 10,
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};
