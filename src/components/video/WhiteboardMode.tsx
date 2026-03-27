import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Audio,
  Video,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

interface WhiteboardModeProps {
  segment: Segment;
  sceneImages?: string[];
}

// Background noise texture to simulate whiteboard/paper
const PAPER_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.05'/%3E%3C/svg%3E")`;

export const WhiteboardMode: React.FC<WhiteboardModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, segment.keyTerms, segment.voiceoverTimings);
  const codeLines = segment.codeSnippet?.code.split('\n');
  const memeGif = segment.scoutedMemeUrl;
  
  // Title animations
  const titleEntrySlide = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 200 },
  });
  
  // Emoji pop-in
  const emojiScale = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 250 },
  });

  const titleEntryOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleExitOpacity = interpolate(frame, [45, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

  // Find current scene
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }

  // Camera canvas panning
  // Practical Psychology uses a giant canvas that slowly pans left or down.
  const canvasPanX = interpolate(frame, [0, durationInFrames], [0, -200], {
    extrapolateRight: "clamp",
  });
  const canvasPanY = interpolate(frame, [0, durationInFrames], [0, 50], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#f8f9fa", // Off-white paper color
        backgroundImage: PAPER_TEXTURE,
        overflow: "hidden",
      }}
    >
      {/* Canvas container that pans slowly */}
      <AbsoluteFill
        style={{
          transform: `translate(${canvasPanX}px, ${canvasPanY}px)`,
        }}
      >
        {/* Segment SFX (Cauldron Integration) */}
        {segment.sfxUrl && <Audio src={segment.sfxUrl} volume={0.5} />}

        {/* Draw a subtle grid to emphasize the whiteboard/notepad aesthetic */}
        <AbsoluteFill
          style={{
            backgroundImage: "radial-gradient(#d1d5db 2px, transparent 2px)",
            backgroundSize: "40px 40px",
            opacity: 0.5,
          }}
        />

        {/* EMOJI FOCUS - Placed slightly offset so it stays in view while panning */}
        <div
          style={{
            position: "absolute",
            top: "30%",
            left: "60%",
            transform: `scale(${emojiScale}) rotate(${Math.sin(frame / 30) * 8}deg)`,
            fontSize: 280,
            filter: "drop-shadow(5px 15px 10px rgba(0,0,0,0.15))",
            zIndex: 1,
          }}
        >
          {segment.emoji}
        </div>

        {/* MEME INTEGRATION: Placed like a polaroid photo stuck to the whiteboard */}
        {memeGif && (
          <div
            style={{
              position: "absolute",
              top: "10%",
              left: "10%",
              width: "35%",
              height: "35%",
              transform: `rotate(-4deg)`,
              backgroundColor: "#fff",
              padding: "10px 10px 40px 10px",
              boxShadow: "2px 4px 12px rgba(0,0,0,0.15)",
              border: "1px solid #ddd",
              opacity: interpolate(frame, [15, 25], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            <Video src={memeGif} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
        )}

        {/* CODE SNIPPET INTEGRATION: Drawn as handwritten monospace text */}
        {codeLines && codeLines.length > 0 && (
          <div
            style={{
              position: "absolute",
              top: memeGif ? "50%" : "20%",
              left: "10%",
              width: "70%",
              fontFamily: "'Caveat', 'Comic Sans MS', cursive, monospace",
              fontSize: 32,
              lineHeight: "40px",
              color: "#0056b3", // Blue ink pen
              opacity: interpolate(frame, [10, 20], [0, 1], { extrapolateRight: "clamp" }),
              whiteSpace: "pre-wrap",
            }}
          >
            {codeLines.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        )}

      </AbsoluteFill>

      {/* Top Title Banner */}
      {frame < 65 && (
        <div
          style={{
            position: "absolute",
            top: 40,
            left: 50,
            opacity: titleOpacity,
            zIndex: 10,
          }}
        >
          <div
            style={{
              padding: "10px 24px",
              border: "3px solid #111",
              borderRadius: "8px",
              backgroundColor: "#fff",
              boxShadow: "6px 6px 0px #111",
              transform: `translateY(${interpolate(titleEntrySlide, [0, 1], [-50, 0])}px) rotate(-2deg)`,
              display: "inline-block",
            }}
          >
            <h2
              style={{
                color: "#111",
                fontSize: 36,
                fontWeight: 900,
                fontFamily: "'Caveat', 'Comic Sans MS', cursive, sans-serif",
                margin: 0,
                letterSpacing: "1px",
              }}
            >
              o {segment.title} o
            </h2>
          </div>
        </div>
      )}

      {/* Scene-based handwritten captions (overriding AnimatedCaptions to use whiteboard mode) */}
      <AbsoluteFill style={{ pointerEvents: "none", zIndex: 5 }}>
        <AnimatedCaptions scenes={scenes} style="whiteboard" />
      </AbsoluteFill>

      {/* Hand-drawn progress bar at the bottom */}
      <div
        style={{
          position: "absolute",
          bottom: 20,
          left: "5%",
          width: "90%",
          height: 8,
          backgroundColor: "rgba(0,0,0,0.1)",
          borderRadius: 10,
          overflow: "hidden",
          border: "2px solid rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${interpolate(frame, [0, durationInFrames], [0, 100])}%`,
            backgroundColor: "#111", // Black sharpie ink
            borderRadius: 10,
          }}
        />
      </div>
    </AbsoluteFill>
  );
};
