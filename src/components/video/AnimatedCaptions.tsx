import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

// CapCut-style pill highlight colors — cycle per page
const PILL_COLORS_BRAINROT = ["#22c55e", "#eab308", "#ec4899", "#3b82f6"];
const PILL_COLORS_FIRESHIP = ["#58a6ff", "#7c3aed", "#06b6d4", "#f97316"];

interface AnimatedCaptionsProps {
  captions: Caption[];
  style?: "brainrot" | "fireship";
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captions,
  style = "brainrot",
}) => {
  const { fps } = useVideoConfig();

  // Group words into 2-3 word phrases (1000ms window at 2.8 wps ≈ 2.8 words)
  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 1000,
  });

  const pillColors =
    style === "brainrot" ? PILL_COLORS_BRAINROT : PILL_COLORS_FIRESHIP;

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: style === "brainrot" ? "20%" : "22%",
        paddingLeft: "4%",
        paddingRight: "4%",
      }}
    >
      {pages.map((page, pageIndex) => {
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const durationFrames = Math.round((page.durationMs / 1000) * fps);
        const pillColor = pillColors[pageIndex % pillColors.length];

        return (
          <Sequence
            key={pageIndex}
            from={startFrame}
            durationInFrames={Math.max(durationFrames, 1)}
          >
            <CaptionPage
              tokens={page.tokens}
              style={style}
              pillColor={pillColor}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

interface CaptionPageProps {
  tokens: { text: string; fromMs: number; toMs: number }[];
  style: "brainrot" | "fireship";
  pillColor: string;
}

const CaptionPage: React.FC<CaptionPageProps> = ({
  tokens,
  style,
  pillColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  // Page entry animation — slide up + fade in
  const pageEntry = spring({
    frame,
    fps,
    config: { damping: 15, mass: 0.6 },
  });
  const pageY = interpolate(pageEntry, [0, 1], [24, 0]);
  const pageOpacity = interpolate(pageEntry, [0, 1], [0, 1]);

  const isBrainrot = style === "brainrot";
  const fontSize = isBrainrot ? 56 : 42;
  const fontWeight = isBrainrot ? 900 : 700;
  const fontFamily = isBrainrot
    ? "system-ui, -apple-system, 'Segoe UI', sans-serif"
    : "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace";

  // Base time for relative animation
  const pageBaseMs = tokens.length > 0 ? tokens[0].fromMs : 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: isBrainrot ? "6px 10px" : "4px 8px",
        maxWidth: "92%",
        opacity: pageOpacity,
        transform: `translateY(${pageY}px)`,
      }}
    >
      {tokens.map((token, i) => {
        const isActive = timeMs >= token.fromMs && timeMs < token.toMs;
        const hasAppeared = timeMs >= token.fromMs;

        // Pill scale-in spring when token becomes active
        const tokenStartFrame = Math.round(
          ((token.fromMs - pageBaseMs) / 1000) * fps
        );
        const pillSpring = spring({
          frame: Math.max(0, frame - tokenStartFrame),
          fps,
          config: { damping: 12, mass: 0.4, stiffness: 200 },
        });
        const pillScale = isActive
          ? interpolate(pillSpring, [0, 1], [0.88, 1])
          : 1;

        // Active token bounces up slightly
        const bounceY = isActive
          ? interpolate(pillSpring, [0, 0.5, 1], [0, -3, 0])
          : 0;

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transformOrigin: "center bottom",
              transform: `scale(${pillScale}) translateY(${bounceY}px)`,
              // Pill highlight on active token
              backgroundColor: isActive ? pillColor : "transparent",
              borderRadius: 8,
              padding: isActive ? "4px 14px" : "4px 6px",
              // Text styling
              color: "#FFFFFF",
              fontSize,
              fontWeight,
              fontFamily,
              lineHeight: 1.3,
              // Layered text-shadow for outline (no WebkitTextStroke)
              textShadow: isBrainrot
                ? "0 2px 4px rgba(0,0,0,0.95), 0 0 8px rgba(0,0,0,0.8), 2px 2px 0 rgba(0,0,0,0.7), -2px -2px 0 rgba(0,0,0,0.7), 2px -2px 0 rgba(0,0,0,0.7), -2px 2px 0 rgba(0,0,0,0.7)"
                : "0 2px 6px rgba(0,0,0,0.9), 1px 1px 0 rgba(0,0,0,0.6), -1px -1px 0 rgba(0,0,0,0.6)",
              opacity: hasAppeared ? 1 : 0.4,
              transition: "background-color 0.08s ease-out",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
