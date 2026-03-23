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
import { generateCaptionData } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

interface BrainrotModeProps {
  segment: Segment;
}

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

  const content = segment.content;
  const captions = generateCaptionData(content);
  const hasImage = !!segment.imageUrl;

  // --- Frame boundaries for image phases ---
  const phase1End = Math.round(durationInFrames * 0.2);
  const phase3Start = Math.round(durationInFrames * 0.8);

  // --- Dynamic image treatment (3 phases) ---
  // Phase 1: Zoom reveal — scale 1.3 + blur → 1.1 + no blur
  const revealProgress = spring({
    frame: Math.min(frame, phase1End),
    fps,
    config: { damping: 18, mass: 1.2 },
  });
  // Phase 2: Living drift — sinusoidal motion
  const driftX = Math.sin((frame / fps) * 0.5) * 15;
  const driftY = Math.cos((frame / fps) * 0.35) * 10;
  // Phase 3: Settle to scale 1.0
  const settleProgress =
    frame > phase3Start
      ? interpolate(frame, [phase3Start, durationInFrames], [0, 1], {
          extrapolateRight: "clamp",
        })
      : 0;

  // Compose the image transform
  const imageScale =
    frame < phase1End
      ? interpolate(revealProgress, [0, 1], [1.3, 1.1])
      : frame > phase3Start
        ? interpolate(settleProgress, [0, 1], [1.08, 1.0])
        : 1.08;
  const imageBlur =
    frame < phase1End
      ? interpolate(revealProgress, [0, 1], [8, 0])
      : 0;
  const imageTranslateX = frame >= phase1End ? driftX : 0;
  const imageTranslateY = frame >= phase1End ? driftY : 0;

  // --- Title animation (visible first ~60 frames, then fades) ---
  const titleEntryOpacity = interpolate(frame, [0, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleSlide = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const titleY = interpolate(titleSlide, [0, 1], [-40, 0]);
  // Fade out title after ~2s to declutter
  const titleExitOpacity = interpolate(frame, [50, 65], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

  // --- Emoji pop ---
  const emojiScale = spring({
    frame: Math.max(0, frame - 3),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });

  // --- Progress bar ---
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // --- Entry/exit animation ---
  const entryScale =
    frame < 8
      ? interpolate(frame, [0, 8], [1.05, 1], { extrapolateRight: "clamp" })
      : 1;
  const entryOpacity =
    frame < 8
      ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" })
      : 1;
  const exitStart = durationInFrames - 8;
  const exitOpacity =
    frame > exitStart
      ? interpolate(frame, [exitStart, durationInFrames], [1, 0], {
          extrapolateRight: "clamp",
        })
      : 1;
  const exitScale =
    frame > exitStart
      ? interpolate(frame, [exitStart, durationInFrames], [1, 0.95], {
          extrapolateRight: "clamp",
        })
      : 1;

  const compositeScale = entryScale * exitScale;
  const compositeOpacity = entryOpacity * exitOpacity;

  // --- Gradient fallback ---
  const gradientSet = GRADIENT_SETS[segment.order % GRADIENT_SETS.length];
  const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);
  const pulseScale = 1 + 0.02 * Math.sin((frame / fps) * Math.PI * 0.5);

  // --- Segment counter ---
  const counterOpacity = interpolate(frame, [8, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#000",
        transform: `scale(${compositeScale})`,
        opacity: compositeOpacity,
      }}
    >
      {/* Layer 1: Background — AI image with dynamic treatment OR animated gradient */}
      {hasImage ? (
        <AbsoluteFill
          style={{
            transform: `scale(${imageScale}) translate(${imageTranslateX}px, ${imageTranslateY}px)`,
            filter: imageBlur > 0 ? `blur(${imageBlur}px)` : undefined,
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
        <>
          <AbsoluteFill
            style={{
              background: `linear-gradient(${gradientAngle}deg, ${gradientSet[0]}, ${gradientSet[1]}, ${gradientSet[2]})`,
              transform: `scale(${pulseScale})`,
              opacity: 0.9,
            }}
          />
          {/* Bokeh particles */}
          <AbsoluteFill style={{ opacity: 0.4 }}>
            {Array.from({ length: 12 }).map((_, i) => {
              const x = ((i * 137.5 + frame * (0.3 + i * 0.1)) % 120) - 10;
              const y = ((i * 97.3 + frame * (0.2 + i * 0.08)) % 120) - 10;
              const size = 30 + i * 18;
              const o = 0.15 + 0.12 * Math.sin((frame + i * 30) / 30);
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
                    background: `radial-gradient(circle, rgba(255,255,255,${o}) 0%, transparent 70%)`,
                    filter: "blur(16px)",
                  }}
                />
              );
            })}
          </AbsoluteFill>
        </>
      )}

      {/* Layer 2: Radial vignette (cinematic) */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.65) 100%)",
        }}
      />

      {/* Layer 3: Bottom gradient for caption readability */}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(to bottom, transparent 45%, rgba(0,0,0,0.5) 65%, rgba(0,0,0,0.85) 100%)",
        }}
      />

      {/* Layer 4: Title section — fades out after ~2s */}
      <Sequence from={0} durationInFrames={durationInFrames}>
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
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
              fontSize: 30,
              fontWeight: 800,
              textAlign: "center",
              margin: "10px 28px 0",
              textShadow:
                "2px 2px 8px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.6)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {segment.title}
          </h2>
          <span
            style={{
              marginTop: 10,
              padding: "5px 16px",
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(4px)",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            {segment.type}
          </span>
        </div>
      </Sequence>

      {/* Layer 5: CapCut-style captions */}
      <AnimatedCaptions captions={captions} style="brainrot" />

      {/* Layer 6: Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          height: 3,
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
          right: "5%",
          opacity: counterOpacity,
          padding: "6px 14px",
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.45)",
          backdropFilter: "blur(8px)",
          color: "rgba(255,255,255,0.85)",
          fontSize: 13,
          fontWeight: 700,
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};
