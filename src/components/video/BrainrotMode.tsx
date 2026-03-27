import React, { useMemo } from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Video,
  Audio,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import { BRAINROT_DB } from "@/lib/brainrot-database";
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

  // Deterministic background selection
  const bgIndex = useMemo(() => {
    let hash = 0;
    for (let i = 0; i < segment.id.length; i++) hash += segment.id.charCodeAt(i);
    return hash % BRAINROT_DB.length;
  }, [segment.id]);
  const brainrotVideoUrl = BRAINROT_DB[bgIndex];

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

      {/* === BOTTOM HALF: Minecraft Parkour / Satisfying Gameplay === */}
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
        <Video
          src={brainrotVideoUrl}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
          muted
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
