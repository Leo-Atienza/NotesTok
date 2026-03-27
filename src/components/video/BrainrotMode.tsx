import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  Video,
  Audio,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import { getBrainrotTheme } from "@/lib/brainrot-database";
import type { Segment } from "@/lib/types";

interface BrainrotModeProps {
  segment: Segment;
  sceneImages?: string[];
}

export const BrainrotMode: React.FC<BrainrotModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, segment.keyTerms, segment.voiceoverTimings);

  // Deterministic animated background theme
  const theme = useMemo(() => getBrainrotTheme(segment.id), [segment.id]);

  // Current scene
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }

  const currentSceneImage = sceneImages[currentSceneIndex] || segment.imageUrl || null;

  // Split-screen pan for top image
  const panY = interpolate(frame, [0, durationInFrames], [0, -30], {
    extrapolateRight: "clamp",
  });
  const panScale = interpolate(frame, [0, durationInFrames], [1, 1.15], {
    extrapolateRight: "clamp",
  });

  // Meme GIF Layer
  const memeGif = segment.scoutedMemeUrl;
  const memeOpacity = interpolate(frame, [30, 40], [0, 1], { extrapolateRight: "clamp" });

  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
      {/* Segment SFX (Cauldron Integration) */}
      {segment.sfxUrl && <Audio src={segment.sfxUrl} volume={0.6} />}
      
      {/* === TOP HALF: AI Visuals / Memes === */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "50%",
          overflow: "hidden",
          borderBottom: "4px solid #fff",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#111",
        }}
      >
        {currentSceneImage && (
          <img
            src={currentSceneImage}
            alt={`Scene visual for ${segment.title}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `scale(${panScale}) translateY(${panY}px)`,
            }}
          />
        )}
        
        {/* If we scouted a meme, float it in the top half */}
        {memeGif && (
          <div
            style={{
              position: "absolute",
              width: "60%",
              height: "60%",
              opacity: memeOpacity,
              transform: `rotate(${Math.sin(frame / 10) * 3}deg)`,
              boxShadow: "0px 10px 40px rgba(0,0,0,0.8)",
              borderRadius: "20px",
              overflow: "hidden",
            }}
          >
            <Video src={memeGif} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}
      </div>

      {/* === BOTTOM HALF: Animated Hypnotic Background === */}
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
        {/* Rotating gradient */}
        <div
          style={{
            position: "absolute",
            inset: "-50%",
            background: `conic-gradient(from ${frame * 3}deg, ${theme.colors[0]}, ${theme.colors[1]}, ${theme.colors[2]}, ${theme.colors[0]})`,
            opacity: 0.8,
            filter: "blur(40px)",
          }}
        />
        {/* Pulsing orbs */}
        {[0, 1, 2].map((i) => {
          const orbX = 20 + i * 30 + Math.sin((frame + i * 40) / 20) * 15;
          const orbY = 30 + Math.cos((frame + i * 60) / 25) * 20;
          const orbScale = 0.8 + Math.sin((frame + i * 30) / 15) * 0.3;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: `${orbX}%`,
                top: `${orbY}%`,
                width: 120,
                height: 120,
                borderRadius: "50%",
                background: `radial-gradient(circle, ${theme.colors[i]}, transparent)`,
                transform: `scale(${orbScale}) translate(-50%, -50%)`,
                opacity: 0.6,
                filter: "blur(20px)",
              }}
            />
          );
        })}
        {/* Scan lines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.15) 3px, rgba(0,0,0,0.15) 4px)",
            pointerEvents: "none",
          }}
        />
      </div>

      {/* === CENTER: HUGE ANIMATED CAPTIONS === */}
      {/* The AnimatedCaptions component already handles its own absolute positioning, 
          so we wrap it or let it span. We will drop a shadow behind it so it pops on the split line. */}
      <AbsoluteFill style={{ pointerEvents: "none" }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle, rgba(0,0,0,0.4) 0%, transparent 60%)" }} />
        <AnimatedCaptions scenes={scenes} style="brainrot" />
      </AbsoluteFill>

      {/* === PROGRESS BAR === */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          height: 8,
          width: `${progressWidth}%`,
          background: "linear-gradient(90deg, #ff0050, #00f2fe)",
          zIndex: 10,
        }}
      />
    </AbsoluteFill>
  );
};
