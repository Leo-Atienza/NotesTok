import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface MemeTextOverlayProps {
  topText?: string;
  bottomText?: string;
  mode: "brainrot" | "fireship";
  showFromFrame?: number;
  durationFrames?: number;
}

export const MemeTextOverlay: React.FC<MemeTextOverlayProps> = ({
  topText,
  bottomText,
  mode,
  showFromFrame = 0,
  durationFrames = 90, // ~3 seconds
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!topText && !bottomText) return null;

  const relativeFrame = frame - showFromFrame;
  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  const entryProgress = spring({
    frame: relativeFrame,
    fps,
    config: { damping: 12, mass: 0.5, stiffness: 200 },
  });

  const fadeOut = interpolate(
    relativeFrame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const fontFamily = mode === "fireship"
    ? "'JetBrains Mono', 'Fira Code', monospace"
    : "'Impact', 'Arial Black', sans-serif";

  const fontSize = mode === "fireship" ? 36 : 48;
  const barBg = mode === "fireship"
    ? "rgba(0, 0, 0, 0.85)"
    : "rgba(255, 255, 255, 0.95)";
  const textColor = mode === "fireship" ? "#00ff88" : "#000";
  const textStroke = mode === "fireship" ? "none" : "2px black";

  const baseStyle: React.CSSProperties = {
    position: "absolute",
    left: 0,
    right: 0,
    padding: mode === "fireship" ? "12px 20px" : "16px 24px",
    backgroundColor: barBg,
    textAlign: "center",
    fontFamily,
    fontSize,
    fontWeight: 900,
    color: textColor,
    WebkitTextStroke: textStroke,
    textTransform: "uppercase",
    letterSpacing: mode === "fireship" ? "0.05em" : "0.02em",
    opacity: fadeOut,
    zIndex: 11,
  };

  return (
    <>
      {topText && (
        <div
          style={{
            ...baseStyle,
            top: 0,
            transform: `translateY(${interpolate(entryProgress, [0, 1], [-80, 0])}px)`,
          }}
        >
          {topText}
        </div>
      )}
      {bottomText && (
        <div
          style={{
            ...baseStyle,
            bottom: "6%",
            transform: `translateY(${interpolate(entryProgress, [0, 1], [80, 0])}px)`,
          }}
        >
          {bottomText}
        </div>
      )}
    </>
  );
};
