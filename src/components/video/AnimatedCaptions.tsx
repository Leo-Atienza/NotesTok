import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
} from "remotion";
import { createTikTokStyleCaptions } from "@remotion/captions";
import type { Caption } from "@remotion/captions";

interface AnimatedCaptionsProps {
  captions: Caption[];
  style?: "brainrot" | "fireship";
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  captions,
  style = "brainrot",
}) => {
  const { fps } = useVideoConfig();

  const { pages } = createTikTokStyleCaptions({
    captions,
    combineTokensWithinMilliseconds: 400,
  });

  return (
    <AbsoluteFill
      style={{
        justifyContent: "flex-end",
        alignItems: "center",
        paddingBottom: style === "brainrot" ? "18%" : "25%",
        paddingLeft: "6%",
        paddingRight: "6%",
      }}
    >
      {pages.map((page, pageIndex) => {
        const startFrame = Math.round((page.startMs / 1000) * fps);
        const durationFrames = Math.round((page.durationMs / 1000) * fps);

        return (
          <Sequence
            key={pageIndex}
            from={startFrame}
            durationInFrames={Math.max(durationFrames, 1)}
          >
            <CaptionPage
              tokens={page.tokens}
              style={style}
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
}

const CaptionPage: React.FC<CaptionPageProps> = ({ tokens, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000;

  // Find the page's base time (first token's fromMs) for relative timing
  const pageBaseMs = tokens.length > 0 ? tokens[0].fromMs : 0;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: style === "brainrot" ? "8px 10px" : "4px 8px",
        maxWidth: "90%",
      }}
    >
      {tokens.map((token, i) => {
        const isActive = timeMs >= token.fromMs && timeMs < token.toMs;
        const hasAppeared = timeMs >= token.fromMs;

        // Spring animation when word becomes active
        const wordStartFrame = Math.round(
          ((token.fromMs - pageBaseMs) / 1000) * fps
        );
        const bounce = spring({
          frame: Math.max(0, frame - wordStartFrame),
          fps,
          config: { damping: 10, mass: 0.5, stiffness: 150 },
        });

        // Entrance opacity
        const opacity = hasAppeared ? 1 : 0.3;

        if (style === "brainrot") {
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transformOrigin: "center bottom",
                transform: `scale(${isActive ? bounce * 1.15 : 1})`,
                color: isActive ? "#FFD700" : "#FFFFFF",
                fontSize: 52,
                fontWeight: 900,
                fontFamily: "system-ui, -apple-system, sans-serif",
                textShadow: isActive
                  ? "0 0 12px #FFD700, 0 0 24px #FFD700, 3px 3px 6px rgba(0,0,0,0.9)"
                  : "2px 2px 6px rgba(0,0,0,0.9), 0 0 2px rgba(0,0,0,0.5)",
                WebkitTextStroke: "1.5px rgba(0,0,0,0.6)",
                opacity,
                transition: "color 0.1s",
              }}
            >
              {token.text}
            </span>
          );
        }

        // Fireship style
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              transformOrigin: "center bottom",
              transform: `scale(${isActive ? bounce * 1.08 : 1})`,
              color: isActive ? "#58a6ff" : "#e6edf3",
              fontSize: 36,
              fontWeight: 700,
              fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
              textShadow: isActive
                ? "0 0 8px rgba(88,166,255,0.6)"
                : "1px 1px 3px rgba(0,0,0,0.5)",
              opacity,
              transition: "color 0.1s",
            }}
          >
            {token.text}
          </span>
        );
      })}
    </div>
  );
};
