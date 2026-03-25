import React, { useEffect, useState } from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { Lottie } from "@remotion/lottie";
import type { LottieAnimationData } from "@remotion/lottie";

interface LottieLayerProps {
  lottieUrl?: string;
  mode: "brainrot" | "fireship";
  /** Frame to start playing the animation */
  showFromFrame?: number;
  /** Duration in frames */
  durationFrames?: number;
  /** Opacity multiplier */
  opacity?: number;
}

export const LottieLayer: React.FC<LottieLayerProps> = ({
  lottieUrl,
  mode,
  showFromFrame = 0,
  durationFrames = 60,
  opacity: opacityProp = 1,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const [animationData, setAnimationData] = useState<LottieAnimationData | null>(null);

  useEffect(() => {
    if (!lottieUrl) return;

    fetch(lottieUrl)
      .then((res) => res.json())
      .then(setAnimationData)
      .catch(() => setAnimationData(null));
  }, [lottieUrl]);

  if (!lottieUrl || !animationData) return null;

  const relativeFrame = frame - showFromFrame;
  if (relativeFrame < 0 || relativeFrame > durationFrames) return null;

  // Fade in and out
  const fadeIn = interpolate(relativeFrame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const fadeOut = interpolate(
    relativeFrame,
    [durationFrames - 10, durationFrames],
    [1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  const opacity = fadeIn * fadeOut * opacityProp * (mode === "fireship" ? 0.5 : 0.8);

  return (
    <AbsoluteFill style={{ opacity, zIndex: 7, pointerEvents: "none" }}>
      <Lottie
        animationData={animationData}
        style={{ width: "100%", height: "100%" }}
        playbackRate={1}
      />
    </AbsoluteFill>
  );
};
