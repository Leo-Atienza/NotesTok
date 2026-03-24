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

// Different zoom/pan presets per scene to simulate camera angles
const CAMERA_PRESETS = [
  { scale: 1.15, x: 0, y: 0 },
  { scale: 1.3, x: -40, y: -20 },
  { scale: 1.25, x: 30, y: -15 },
  { scale: 1.35, x: -20, y: 30 },
  { scale: 1.2, x: 25, y: 25 },
  { scale: 1.4, x: 0, y: -30 },
  { scale: 1.3, x: 0, y: 35 },
];

// Animated gradient fallback colors
const GRADIENT_SETS = [
  ["#0f0c29", "#302b63", "#24243e"],
  ["#1a1a2e", "#16213e", "#0f3460"],
  ["#0a192f", "#172a45", "#1d3557"],
  ["#1b0033", "#300050", "#4a0072"],
  ["#001219", "#005f73", "#0a9396"],
];

export const BrainrotMode: React.FC<BrainrotModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, 2.8, segment.keyTerms);
  const hasSingleImage = !!segment.imageUrl;
  const hasSceneImages = sceneImages.length > 0;

  // --- Progress bar ---
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // --- Hook slide (first segment only, ~50 frames) ---
  const isFirstSegment = segment.order === 0;
  const hookDuration = isFirstSegment ? 50 : 0;

  const hookFlash = interpolate(frame, [0, 2, 5], [0.5, 0.3, 0], {
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

  // --- Title animation for non-first segments ---
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

  // --- Determine current scene ---
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }
  const camera = CAMERA_PRESETS[currentSceneIndex % CAMERA_PRESETS.length];

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

  // Previous scene image for crossfade
  const prevSceneIndex = Math.max(0, currentSceneIndex - 1);
  const prevSceneImage =
    hasSceneImages && sceneImages[prevSceneIndex]
      ? sceneImages[prevSceneIndex]
      : null;

  // Crossfade over 8 frames at scene start
  const transitionProgress = interpolate(
    frame - sceneStartFrame,
    [0, 8],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Gradient fallback
  const gradientSet = GRADIENT_SETS[currentSceneIndex % GRADIENT_SETS.length];
  const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Per-scene background */}
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
        <AbsoluteFill
          style={{
            background: `linear-gradient(${gradientAngle}deg, ${gradientSet[0]}, ${gradientSet[1]}, ${gradientSet[2]})`,
          }}
        />
      )}

      {/* Layer 2: Dark vignette */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.3) 20%, rgba(0,0,0,0.75) 100%)",
        }}
      />

      {/* Layer 3: Hook slide (first segment dramatic intro) */}
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

      {/* Layer 4: Regular title (non-first segments) */}
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

      {/* Layer 5: Scene-based captions */}
      <AnimatedCaptions scenes={scenes} style="brainrot" />

      {/* Layer 6: Progress bar */}
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

      {/* Layer 7: Segment counter */}
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
