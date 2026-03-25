import React from "react";
import { useCurrentFrame, useVideoConfig, spring, interpolate } from "remotion";

interface CharacterLayerProps {
  imageUrl?: string;
  mode: "brainrot" | "fireship";
  /** Position on screen */
  position?: "bottom-left" | "bottom-right";
  /** Show entrance animation from the side */
  enterFrame?: number;
}

export const CharacterLayer: React.FC<CharacterLayerProps> = ({
  imageUrl,
  mode,
  position = "bottom-right",
  enterFrame = 10,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  if (!imageUrl) return null;

  // Spring entrance from the side
  const entranceProgress = spring({
    frame: Math.max(0, frame - enterFrame),
    fps,
    config: { damping: 10, mass: 0.6, stiffness: 200 },
  });

  const isLeft = position === "bottom-left";
  const slideFrom = isLeft ? -150 : 150;
  const slideX = interpolate(entranceProgress, [0, 1], [slideFrom, 0]);

  // Idle bobbing animation
  const bobY = Math.sin(frame * 0.06) * 4;
  const bobRotate = Math.sin(frame * 0.04) * 1.5;

  // Mode-specific sizing
  const size = mode === "brainrot" ? 280 : 180;
  const opacity = mode === "fireship" ? 0.7 : 1;
  const filter = mode === "fireship" ? "grayscale(0.3) brightness(0.9)" : "none";

  return (
    <div
      style={{
        position: "absolute",
        bottom: mode === "brainrot" ? "12%" : "8%",
        [isLeft ? "left" : "right"]: mode === "brainrot" ? "2%" : "3%",
        width: size,
        height: size,
        transform: `translateX(${slideX}px) translateY(${bobY}px) rotate(${bobRotate}deg)`,
        opacity,
        filter,
        zIndex: 6,
        pointerEvents: "none",
      }}
    >
      <img
        src={imageUrl}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "contain",
          filter: "drop-shadow(0 6px 20px rgba(0,0,0,0.6))",
        }}
      />
    </div>
  );
};
