import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface POVOverlayProps {
  text?: string;
  mode: "brainrot" | "fireship";
  /** Frame to start the POV text */
  showFromFrame?: number;
  /** Duration in frames */
  durationFrames?: number;
}

export const POVOverlay: React.FC<POVOverlayProps> = ({
  text,
  mode,
  showFromFrame = 0,
  durationFrames = 75, // ~2.5 seconds
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!text) return null;

  const relativeFrame = frame - showFromFrame;
  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  // Typewriter effect: reveal one character at a time
  const displayText = mode === "fireship" ? `> ${text}` : text;
  const charsPerFrame = 1.2;
  const visibleChars = Math.floor(relativeFrame * charsPerFrame);
  const typedText = displayText.slice(0, Math.min(visibleChars, displayText.length));
  const isTyping = visibleChars < displayText.length;

  // Fade out
  const fadeOut = interpolate(
    relativeFrame,
    [durationFrames - 12, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Entry slide
  const entrySlide = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 14, mass: 0.6, stiffness: 180 },
  });
  const slideY = interpolate(entrySlide, [0, 1], [30, 0]);

  // Blinking cursor
  const showCursor = isTyping || (relativeFrame % 20 < 10);

  const fontFamily = mode === "fireship"
    ? "'JetBrains Mono', 'Fira Code', monospace"
    : "system-ui, -apple-system, sans-serif";

  const fontSize = mode === "fireship" ? 32 : 42;

  return (
    <div
      style={{
        position: "absolute",
        top: "15%",
        left: "6%",
        right: "6%",
        opacity: fadeOut,
        transform: `translateY(${slideY}px)`,
        zIndex: 9,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          backgroundColor: mode === "fireship"
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(12px)",
          borderRadius: mode === "fireship" ? 8 : 16,
          padding: mode === "fireship" ? "16px 20px" : "20px 28px",
          border: mode === "fireship"
            ? "1px solid rgba(0, 255, 136, 0.3)"
            : "2px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <span
          style={{
            fontFamily,
            fontSize,
            fontWeight: 800,
            color: mode === "fireship" ? "#00ff88" : "#fff",
            lineHeight: 1.3,
            textShadow: mode === "fireship"
              ? "0 0 20px rgba(0,255,136,0.3)"
              : "2px 2px 0 rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.6)",
          }}
        >
          {typedText}
          {showCursor && (
            <span
              style={{
                color: mode === "fireship" ? "#00ff88" : "#fff",
                opacity: 0.8,
              }}
            >
              |
            </span>
          )}
        </span>
      </div>
    </div>
  );
};
