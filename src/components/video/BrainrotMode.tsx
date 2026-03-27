import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  OffthreadVideo,
  Img,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import { GifOverlay } from "./layers/GifOverlay";
import { CharacterLayer } from "./layers/CharacterLayer";
import { StickerBurst } from "./layers/StickerBurst";
import { MemeTextOverlay } from "./layers/MemeTextOverlay";
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

  const scenes = generateSceneData(
    segment.content,
    segment.keyTerms,
    segment.voiceoverTimings
  );

  // Current scene tracking
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }

  // Scene resources from cauldron (if available)
  const sceneRes = cauldronResources?.scenes?.[currentSceneIndex];

  // Top-half image: AI scene image > stock photo > segment image
  const currentTopImage =
    sceneImages[currentSceneIndex] ||
    scenePhotoUrls[currentSceneIndex] ||
    segment.imageUrl ||
    null;

  // Bottom-half video: satisfying/gameplay footage from Pexels
  const bottomVideoUrl = backgroundVideoUrl || null;

  // Ken Burns pan for top image — slow drift for engagement
  const panY = interpolate(frame, [0, durationInFrames], [0, -25], {
    extrapolateRight: "clamp",
  });
  const panScale = interpolate(frame, [0, durationInFrames], [1.05, 1.18], {
    extrapolateRight: "clamp",
  });

  // Meme GIF from scout
  const memeGif = segment.scoutedMemeUrl;

  // Progress bar (TOP — TikTok style)
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Glitch-cut flash on scene transitions
  const isTransitioning = useMemo(() => {
    for (const scene of scenes) {
      const sceneStartFrame = Math.floor((scene.startMs / 1000) * fps);
      if (frame >= sceneStartFrame && frame < sceneStartFrame + 3) return true;
    }
    return false;
  }, [frame, scenes, fps]);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* === TOP HALF: Educational AI Visuals (960px) === */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          overflow: "hidden",
        }}
      >
        {currentTopImage ? (
          <Img
            src={currentTopImage}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${panScale}) translateY(${panY}px)`,
            }}
          />
        ) : (
          /* Fallback: dark cinematic gradient with emoji */
          <div
            style={{
              width: "100%",
              height: "100%",
              background:
                "linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ fontSize: 64, filter: "grayscale(0.2)" }}>
              {segment.emoji || "🧠"}
            </span>
          </div>
        )}

        {/* Dark overlay for caption readability over top image */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Meme GIF overlay (floats in top half) */}
        {memeGif && (
          <GifOverlay
            gifUrl={memeGif}
            position="top-right"
            mode="brainrot"
            showFromFrame={20}
            durationFrames={90}
          />
        )}

        {/* Cauldron: character pose */}
        {sceneRes?.characterImageUrl && (
          <CharacterLayer
            imageUrl={sceneRes.characterImageUrl}
            mode="brainrot"
            position="bottom-right"
            enterFrame={5}
          />
        )}

        {/* Cauldron: sticker burst */}
        {sceneRes?.stickerUrls && sceneRes.stickerUrls.length > 0 && (
          <StickerBurst
            stickerUrls={sceneRes.stickerUrls}
            mode="brainrot"
            showFromFrame={8}
            durationFrames={50}
          />
        )}
      </div>

      {/* === DIVIDER LINE (white, 50% opacity, 4px) === */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 2px)",
          left: 0,
          right: 0,
          height: 4,
          background: "rgba(255,255,255,0.5)",
          zIndex: 10,
        }}
      />

      {/* === BOTTOM HALF: Satisfying / Gameplay Video (960px) === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50%",
          overflow: "hidden",
          backgroundColor: "#000",
        }}
      >
        {bottomVideoUrl ? (
          <OffthreadVideo
            src={bottomVideoUrl}
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        ) : backgroundPhotoUrl ? (
          /* Fallback: stock photo with slow pan */
          <Img
            src={backgroundPhotoUrl}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${panScale}) translateX(${Math.sin(frame * 0.02) * 15}px)`,
            }}
          />
        ) : (
          /* Last resort: engaging abstract fluid animation */
          <AbstractSatisfyingBackground frame={frame} />
        )}

        {/* Subtle vignette on bottom half */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.4) 100%)",
            pointerEvents: "none",
          }}
        />

        {/* Cauldron: meme text overlay */}
        {sceneRes?.memeText && (
          <MemeTextOverlay
            topText={sceneRes.memeText.top}
            bottomText={sceneRes.memeText.bottom}
            mode="brainrot"
            showFromFrame={10}
            durationFrames={75}
          />
        )}
      </div>

      {/* === CENTER: WORD-SLAM CAPTIONS (positioned in top half) === */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        {/* Dark radial vignette behind captions for readability */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "50%",
            background:
              "radial-gradient(ellipse at center 55%, rgba(0,0,0,0.45) 0%, transparent 60%)",
          }}
        />
        <AnimatedCaptions scenes={scenes} style="brainrot" />
      </AbsoluteFill>

      {/* === GLITCH FLASH on scene transitions === */}
      {isTransitioning && (
        <AbsoluteFill
          style={{
            backgroundColor: `rgba(255,255,255,${0.12 + Math.random() * 0.08})`,
            mixBlendMode: "overlay",
            pointerEvents: "none",
            zIndex: 12,
          }}
        />
      )}

      {/* === PROGRESS BAR (TOP — TikTok style) === */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 4,
          width: `${progressWidth}%`,
          background: "linear-gradient(90deg, #ff0050, #ffea00, #00f2fe)",
          zIndex: 15,
          borderRadius: "0 2px 2px 0",
        }}
      />
    </AbsoluteFill>
  );
};

/**
 * Abstract satisfying animated background for when no stock video is available.
 * Simulates fluid/lava lamp motion with bright neon colors — engaging fallback
 * that keeps the brainrot energy even without real gameplay footage.
 */
const AbstractSatisfyingBackground: React.FC<{ frame: number }> = ({
  frame,
}) => {
  // Color palette cycles through satisfying neon tones
  const hue1 = (frame * 0.8) % 360;
  const hue2 = (hue1 + 120) % 360;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: `linear-gradient(${frame * 0.5}deg, hsl(${hue1}, 80%, 12%) 0%, hsl(${hue2}, 70%, 8%) 100%)`,
      }}
    >
      {/* Fluid blobs — simulates satisfying liquid motion */}
      {[0, 1, 2, 3].map((i) => {
        const t = frame * 0.015 + i * 1.5;
        const x = 50 + Math.sin(t * 0.7 + i) * 35;
        const y = 50 + Math.cos(t * 0.5 + i * 2) * 35;
        const size = 250 + Math.sin(t * 0.3 + i * 3) * 80;
        const hue = (hue1 + i * 90) % 360;

        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, hsla(${hue}, 90%, 55%, 0.5), transparent)`,
              transform: "translate(-50%, -50%)",
              filter: "blur(40px)",
            }}
          />
        );
      })}

      {/* Scan lines for retro brainrot aesthetic */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.1) 3px, rgba(0,0,0,0.1) 4px)",
          pointerEvents: "none",
        }}
      />
    </div>
  );
};
