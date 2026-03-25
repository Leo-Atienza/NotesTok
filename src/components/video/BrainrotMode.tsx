import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import {
  BackgroundLayer,
  CharacterLayer,
  GifOverlay,
  LottieLayer,
  StickerBurst,
  MemeTextOverlay,
  POVOverlay,
} from "./layers";
import { pickTransition, getFlashOpacity, getTransitionTransform } from "./transitions";
import type { Segment } from "@/lib/types";
import type { ResolvedSegmentResources } from "@/lib/media-types";

interface BrainrotModeProps {
  segment: Segment;
  sceneImages?: string[];
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  scenePhotoUrls?: string[];
  cauldronResources?: ResolvedSegmentResources;
}

// Camera presets — Ken Burns zoom/pan for each scene
const CAMERA_PRESETS = [
  { scale: 1.15, x: 0, y: -15, rotate: 0 },
  { scale: 1.25, x: -30, y: -10, rotate: -1 },
  { scale: 1.2, x: 20, y: -20, rotate: 1 },
  { scale: 1.3, x: -15, y: 15, rotate: -0.5 },
  { scale: 1.18, x: 25, y: 10, rotate: 0.5 },
  { scale: 1.35, x: 0, y: -25, rotate: 0 },
  { scale: 1.22, x: -20, y: 20, rotate: 1.5 },
  { scale: 1.28, x: 15, y: -15, rotate: -1.5 },
  { scale: 1.12, x: -10, y: 10, rotate: 2 },
  { scale: 1.32, x: 10, y: -30, rotate: -2 },
  { scale: 1.2, x: 30, y: 5, rotate: 0 },
  { scale: 1.25, x: -25, y: -20, rotate: 1 },
];

// Gradient themes when no images
const SCENE_THEMES = [
  { bg: ["#1a0533", "#3b0764", "#7c3aed"], accent: "#a78bfa" },
  { bg: ["#2d0a0a", "#7f1d1d", "#dc2626"], accent: "#f87171" },
  { bg: ["#0a2540", "#0e7490", "#06b6d4"], accent: "#22d3ee" },
  { bg: ["#1c1917", "#78350f", "#d97706"], accent: "#fbbf24" },
  { bg: ["#052e16", "#065f46", "#059669"], accent: "#34d399" },
  { bg: ["#1e1b4b", "#4c1d95", "#7c3aed"], accent: "#c4b5fd" },
  { bg: ["#0c1445", "#1e3a5f", "#2563eb"], accent: "#60a5fa" },
];

export const BrainrotMode: React.FC<BrainrotModeProps> = ({
  segment,
  sceneImages = [],
  backgroundVideoUrl,
  backgroundPhotoUrl,
  scenePhotoUrls = [],
  cauldronResources,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, 3.2, segment.keyTerms);
  const hasSceneImages = sceneImages.length > 0;
  const hasScenePhotos = scenePhotoUrls.length > 0;

  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Hook slide (first segment only)
  const isFirstSegment = segment.order === 0;
  const hookDuration = isFirstSegment ? 45 : 0;

  const hookFlash = interpolate(frame, [0, 2, 4], [0.5, 0.2, 0], {
    extrapolateRight: "clamp",
  });
  const hookEmojiScale = spring({
    frame: Math.max(0, frame - 2),
    fps,
    config: { damping: 6, mass: 0.4, stiffness: 280 },
  });
  const hookTitleScale = spring({
    frame: Math.max(0, frame - 6),
    fps,
    config: { damping: 10, mass: 0.5, stiffness: 220 },
  });
  const hookExitOpacity = isFirstSegment
    ? interpolate(frame, [hookDuration - 8, hookDuration], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;

  // Title for non-first segments
  const titleEntryOpacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: "clamp" });
  const titleSlide = spring({ frame, fps, config: { damping: 12, mass: 0.7 } });
  const titleY = interpolate(titleSlide, [0, 1], [-30, 0]);
  const titleExitOpacity = interpolate(frame, [35, 45], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

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
  const sceneProgress = Math.min((frame - sceneStartFrame) * 0.015, 1);
  const frameSinceSceneStart = frame - sceneStartFrame;

  // Scene photo/image lookup
  const currentScenePhoto = hasScenePhotos ? scenePhotoUrls[currentSceneIndex] ?? null : null;
  const currentSceneImage = hasSceneImages
    ? sceneImages[currentSceneIndex] ?? segment.imageUrl ?? null
    : segment.imageUrl ?? null;

  const prevSceneIndex = Math.max(0, currentSceneIndex - 1);
  const prevScenePhoto = hasScenePhotos ? scenePhotoUrls[prevSceneIndex] ?? null : null;
  const prevSceneImage = hasSceneImages ? sceneImages[prevSceneIndex] ?? null : null;

  const transitionProgress = interpolate(frameSinceSceneStart, [0, 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Transition effects
  const transitionType = pickTransition(currentSceneIndex);
  const transitionTransform = currentSceneIndex > 0
    ? getTransitionTransform(transitionType, frameSinceSceneStart)
    : {};
  const flashOpacity = currentSceneIndex > 0
    ? getFlashOpacity(transitionType, frameSinceSceneStart)
    : 0;

  // Gradient rotation for fallback
  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 225]);

  // Cauldron resources for current scene
  const sceneResources = cauldronResources?.scenes?.[currentSceneIndex];

  // Calculate GIF show frame relative to scene start
  const gifShowFrame = sceneStartFrame + 15;
  const stickerShowFrame = sceneStartFrame + 5;
  const lottieShowFrame = sceneStartFrame;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden", ...transitionTransform }}>
      {/* === LAYER 1: Background === */}
      <BackgroundLayer
        backgroundVideoUrl={sceneResources?.backgroundUrl && sceneResources.backgroundType === "video"
          ? sceneResources.backgroundUrl
          : backgroundVideoUrl}
        backgroundPhotoUrl={sceneResources?.backgroundUrl && sceneResources.backgroundType === "photo"
          ? sceneResources.backgroundUrl
          : backgroundPhotoUrl}
        currentScenePhoto={currentScenePhoto}
        currentSceneImage={currentSceneImage}
        prevScenePhoto={prevScenePhoto}
        prevSceneImage={prevSceneImage}
        camera={camera}
        sceneProgress={sceneProgress}
        transitionProgress={transitionProgress}
        theme={theme}
        gradientAngle={gradientAngle}
      />

      {/* === LAYER 2: Dark gradient overlay === */}
      <AbsoluteFill
        style={{
          background: backgroundVideoUrl || currentScenePhoto || currentSceneImage
            ? "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.8) 100%)"
            : "linear-gradient(to bottom, transparent 0%, transparent 50%, rgba(0,0,0,0.4) 80%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* === LAYER 3: Top vignette === */}
      <AbsoluteFill
        style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.4) 0%, transparent 15%)" }}
      />

      {/* === LAYER 4: Character overlay === */}
      <CharacterLayer
        imageUrl={sceneResources?.characterImageUrl}
        mode="brainrot"
        position="bottom-right"
        enterFrame={sceneStartFrame + 8}
      />

      {/* === LAYER 5: Reaction GIF overlay === */}
      <GifOverlay
        gifUrl={sceneResources?.gifUrl}
        position={sceneResources?.gifPosition}
        mode="brainrot"
        showFromFrame={gifShowFrame}
        durationFrames={75}
      />

      {/* === LAYER 6: Lottie effect === */}
      <LottieLayer
        lottieUrl={sceneResources?.lottieUrl}
        mode="brainrot"
        showFromFrame={lottieShowFrame}
        durationFrames={45}
      />

      {/* === LAYER 7: Sticker/emoji burst === */}
      <StickerBurst
        stickerUrls={sceneResources?.stickerUrls}
        mode="brainrot"
        showFromFrame={stickerShowFrame}
        durationFrames={45}
      />

      {/* === LAYER 8: Scene transition flash === */}
      {flashOpacity > 0 && (
        <AbsoluteFill
          style={{ backgroundColor: "#fff", opacity: flashOpacity, zIndex: 15 }}
        />
      )}

      {/* === LAYER 9: POV text (first scene only) === */}
      <POVOverlay
        text={sceneResources?.povText}
        mode="brainrot"
        showFromFrame={0}
        durationFrames={75}
      />

      {/* === LAYER 10: Meme text bars === */}
      <MemeTextOverlay
        topText={sceneResources?.memeText?.top}
        bottomText={sceneResources?.memeText?.bottom}
        mode="brainrot"
        showFromFrame={sceneStartFrame}
        durationFrames={90}
      />

      {/* === Hook slide (first segment intro) === */}
      {isFirstSegment && frame < hookDuration && (
        <>
          {frame < 4 && (
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
              padding: "0 8%",
              opacity: frame < hookDuration - 8 ? 1 : hookExitOpacity,
              zIndex: 10,
            }}
          >
            <span
              style={{
                fontSize: 100,
                transform: `scale(${hookEmojiScale})`,
                display: "inline-block",
                filter: "drop-shadow(0 8px 24px rgba(0,0,0,0.6))",
                marginBottom: 16,
              }}
            >
              {segment.emoji}
            </span>
            <h1
              style={{
                color: "#fff",
                fontSize: 56,
                fontWeight: 900,
                textAlign: "center",
                textTransform: "uppercase",
                letterSpacing: "-0.02em",
                lineHeight: 1.1,
                transform: `scale(${interpolate(hookTitleScale, [0, 1], [0.5, 1])})`,
                opacity: interpolate(hookTitleScale, [0, 1], [0, 1]),
                textShadow:
                  "4px 4px 0 rgba(0,0,0,0.9), -4px -4px 0 rgba(0,0,0,0.9), " +
                  "4px -4px 0 rgba(0,0,0,0.9), -4px 4px 0 rgba(0,0,0,0.9), " +
                  "0 8px 20px rgba(0,0,0,0.8)",
                fontFamily: "system-ui, -apple-system, sans-serif",
                margin: 0,
              }}
            >
              {segment.title}
            </h1>
          </AbsoluteFill>
        </>
      )}

      {/* === Title (non-first segments) === */}
      {!isFirstSegment && frame < 45 && (
        <div
          style={{
            position: "absolute",
            top: "6%",
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
          <span style={{ fontSize: 64, display: "inline-block", filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.7))" }}>
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#fff",
              fontSize: 34,
              fontWeight: 800,
              textAlign: "center",
              margin: "8px 24px 0",
              textShadow: "3px 3px 0 rgba(0,0,0,0.9), -3px -3px 0 rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.8)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.2,
            }}
          >
            {segment.title}
          </h2>
        </div>
      )}

      {/* === Animated captions === */}
      <AnimatedCaptions scenes={scenes} style="brainrot" />

      {/* === Scene counter === */}
      <div
        style={{
          position: "absolute",
          top: "4%",
          right: "4%",
          padding: "6px 14px",
          borderRadius: 20,
          backgroundColor: "rgba(0,0,0,0.5)",
          backdropFilter: "blur(8px)",
          color: "rgba(255,255,255,0.9)",
          fontSize: 14,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
          zIndex: 10,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {currentSceneIndex + 1}/{scenes.length}
      </div>

      {/* === Progress bar === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 4,
          width: `${progressWidth}%`,
          background: `linear-gradient(90deg, ${theme.accent}, #fff)`,
          borderRadius: "3px 3px 0 0",
          zIndex: 10,
          boxShadow: `0 0 10px ${theme.accent}60`,
        }}
      />
    </AbsoluteFill>
  );
};
