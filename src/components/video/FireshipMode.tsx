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

interface FireshipModeProps {
  segment: Segment;
}

export const FireshipMode: React.FC<FireshipModeProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content);
  const hasImage = !!segment.imageUrl;

  // --- Title section (enters, then fades by frame ~55) ---
  const emojiScale = spring({
    frame,
    fps,
    config: { damping: 8, mass: 0.4, stiffness: 200 },
  });
  const titleSlideX = interpolate(
    spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } }),
    [0, 1],
    [-300, 0]
  );
  const titleEntryOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleExitOpacity = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleExitY = interpolate(frame, [40, 55], [0, -50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

  const badgeOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [30, 48], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Animated accent glows ---
  const glow1Top = -100 + Math.sin(frame / 60) * 30;
  const glow1Right = -100 + Math.cos(frame / 60) * 20;
  const glow2Bottom = -80 + Math.sin(frame / 50) * 25;
  const glow2Left = -80 + Math.cos(frame / 50) * 15;

  // --- Image card ---
  const imageSlide = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const imageX = interpolate(imageSlide, [0, 1], [120, 0]);
  const imageEntryOpacity = interpolate(imageSlide, [0, 1], [0, 1]);
  const imageFloat = Math.sin(frame / 40) * 3;
  // Fade image after title to give focus to captions
  const imageFadeOpacity = interpolate(frame, [55, 75], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const borderGlow = 0.15 + 0.1 * Math.sin(frame / 20);

  // --- Key terms as left-edge badges ---
  const currentTimeMs = (frame / fps) * 1000;
  const keyTermTimings = segment.keyTerms.map((term) => {
    const pos = segment.content.toLowerCase().indexOf(term.toLowerCase());
    if (pos < 0) return durationInFrames * 0.6;
    const wordsBefore = segment.content.slice(0, pos).split(/\s+/).length;
    const totalWords = segment.content.split(/\s+/).length;
    const frac = wordsBefore / totalWords;
    return Math.round(40 + frac * (durationInFrames - 80));
  });

  // --- Progress bar ---
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0d1117 0%, #161b22 40%, #1c2333 100%)",
      }}
    >
      {/* Subtle grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Animated accent glows */}
      <div
        style={{
          position: "absolute",
          top: glow1Top,
          right: glow1Right,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: glow2Bottom,
          left: glow2Left,
          width: 250,
          height: 250,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,166,87,0.06) 0%, transparent 70%)",
        }}
      />

      {/* Title section — slides up and fades */}
      {frame < 55 && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 28px",
            opacity: titleOpacity,
            transform: `translateY(${titleExitY}px)`,
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 56,
              transform: `scale(${emojiScale})`,
              display: "inline-block",
              marginBottom: 8,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#e6edf3",
              fontSize: 28,
              fontWeight: 800,
              textAlign: "center",
              transform: `translateX(${titleSlideX}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.25,
              maxWidth: "90%",
              margin: 0,
            }}
          >
            {segment.title}
          </h2>
          <span
            style={{
              marginTop: 8,
              padding: "4px 14px",
              borderRadius: 6,
              backgroundColor:
                segment.type === "concept"
                  ? "rgba(88,166,255,0.15)"
                  : segment.type === "example"
                    ? "rgba(255,166,87,0.15)"
                    : "rgba(87,255,166,0.15)",
              color:
                segment.type === "concept"
                  ? "#58a6ff"
                  : segment.type === "example"
                    ? "#ffa657"
                    : "#57ffaa",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              opacity: badgeOpacity,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            {segment.type}
          </span>
          <div
            style={{
              marginTop: 14,
              height: 2,
              width: `${lineWidth}%`,
              maxWidth: 250,
              background:
                "linear-gradient(90deg, transparent, #58a6ff, transparent)",
              borderRadius: 1,
            }}
          />
        </div>
      )}

      {/* Image card — slides in, floats, fades after title */}
      {hasImage && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: `translateX(calc(-50% + ${imageX}px)) translateY(${imageFloat}px)`,
            opacity: imageEntryOpacity * imageFadeOpacity,
            width: "65%",
            maxWidth: 700,
            aspectRatio: "16/9",
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid rgba(88,166,255,${borderGlow})`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(88,166,255,${borderGlow * 0.5})`,
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
        </div>
      )}

      {/* Scene-based captions */}
      <AnimatedCaptions scenes={scenes} style="fireship" />

      {/* Key terms — left-edge vertical badges */}
      <div
        style={{
          position: "absolute",
          left: "3%",
          top: "42%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {segment.keyTerms.map((term, i) => {
          const termAppearFrame = keyTermTimings[i];
          const termScale = spring({
            frame: Math.max(0, frame - termAppearFrame),
            fps,
            config: { damping: 10, mass: 0.4 },
          });
          const termOpacity =
            frame >= termAppearFrame
              ? interpolate(
                  frame,
                  [termAppearFrame, termAppearFrame + 10],
                  [0, 1],
                  { extrapolateRight: "clamp" }
                )
              : 0;

          return (
            <span
              key={term}
              style={{
                display: "inline-block",
                transform: `scale(${termScale})`,
                transformOrigin: "left center",
                opacity: termOpacity,
                padding: "4px 10px",
                borderRadius: 6,
                backgroundColor: "rgba(88,166,255,0.12)",
                border: "1px solid rgba(88,166,255,0.25)",
                color: "#58a6ff",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                whiteSpace: "nowrap",
              }}
            >
              {term}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 3,
          width: `${progressWidth}%`,
          backgroundColor: "#58a6ff",
          borderRadius: "0 2px 2px 0",
          zIndex: 10,
        }}
      />

      {/* Segment counter */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          right: "4%",
          padding: "5px 12px",
          borderRadius: 6,
          backgroundColor: "rgba(48,54,61,0.5)",
          color: "rgba(230,237,243,0.6)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'SF Mono', monospace",
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};
