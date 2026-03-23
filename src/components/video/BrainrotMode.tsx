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

  // Ken Burns effect on AI image — slow zoom + slight pan
  const kenBurnsScale = interpolate(frame, [0, durationInFrames], [1.0, 1.15], {
    extrapolateRight: "clamp",
  });
  const kenBurnsPanX = interpolate(frame, [0, durationInFrames], [0, -15], {
    extrapolateRight: "clamp",
  });
  const kenBurnsPanY = interpolate(frame, [0, durationInFrames], [0, -8], {
    extrapolateRight: "clamp",
  });

  // Title animation
  const titleOpacity = interpolate(frame, [0, 20], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleSlide = spring({
    frame,
    fps,
    config: { damping: 12, mass: 0.8 },
  });
  const titleY = interpolate(titleSlide, [0, 1], [-40, 0]);

  // Emoji pop
  const emojiScale = spring({
    frame: Math.max(0, frame - 5),
    fps,
    config: { damping: 8, mass: 0.5, stiffness: 200 },
  });

  // Segment counter fade
  const counterOpacity = interpolate(frame, [10, 25], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Animated gradient fallback
  const gradientSet = GRADIENT_SETS[segment.order % GRADIENT_SETS.length];
  const gradientAngle = interpolate(frame, [0, durationInFrames], [0, 360]);
  const pulseScale = 1 + 0.02 * Math.sin((frame / fps) * Math.PI * 0.5);

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {/* Layer 1: Background — AI image with Ken Burns OR animated gradient */}
      {hasImage ? (
        <AbsoluteFill
          style={{
            transform: `scale(${kenBurnsScale}) translate(${kenBurnsPanX}px, ${kenBurnsPanY}px)`,
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
          {/* Bokeh particles for gradient fallback */}
          <AbsoluteFill style={{ opacity: 0.3 }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const x = ((i * 137.5 + frame * (0.3 + i * 0.1)) % 120) - 10;
              const y = ((i * 97.3 + frame * (0.2 + i * 0.08)) % 120) - 10;
              const size = 40 + i * 20;
              const o = 0.15 + 0.1 * Math.sin((frame + i * 30) / 30);
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
                    filter: "blur(20px)",
                  }}
                />
              );
            })}
          </AbsoluteFill>
        </>
      )}

      {/* Layer 2: Dark overlays for text readability */}
      <AbsoluteFill
        style={{
          background: hasImage
            ? "linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 30%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 100%)"
            : "linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 20%, transparent 50%, rgba(0,0,0,0.7) 100%)",
        }}
      />

      {/* Layer 3: Title + emoji at top */}
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
              filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#fff",
              fontSize: 28,
              fontWeight: 800,
              textAlign: "center",
              margin: "8px 24px 0",
              textShadow: "2px 2px 8px rgba(0,0,0,0.9), 0 0 20px rgba(0,0,0,0.5)",
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.3,
            }}
          >
            {segment.title}
          </h2>
          <span
            style={{
              marginTop: 8,
              padding: "4px 14px",
              borderRadius: 20,
              backgroundColor: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              color: "rgba(255,255,255,0.8)",
              fontSize: 12,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: 1.2,
            }}
          >
            {segment.type}
          </span>
        </div>
      </Sequence>

      {/* Layer 4: Animated captions — the star of the show */}
      <AnimatedCaptions captions={captions} style="brainrot" />

      {/* Layer 5: Segment counter */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          right: "5%",
          opacity: counterOpacity,
          padding: "6px 14px",
          borderRadius: 16,
          backgroundColor: "rgba(0,0,0,0.4)",
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
