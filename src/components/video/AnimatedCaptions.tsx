import React from "react";
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  spring,
  interpolate,
} from "remotion";
import type { Scene } from "./CaptionEngine";

// Pill highlight colors — cycle per scene
const PILL_COLORS = ["#dc2626", "#22c55e", "#eab308", "#3b82f6", "#ec4899"];

interface AnimatedCaptionsProps {
  scenes: Scene[];
  style?: "brainrot" | "fireship";
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  scenes,
  style = "brainrot",
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {scenes.map((scene, sceneIndex) => {
        const startFrame = Math.round((scene.startMs / 1000) * fps);
        const durationFrames = Math.round(
          ((scene.endMs - scene.startMs) / 1000) * fps
        );
        const pillColor = PILL_COLORS[sceneIndex % PILL_COLORS.length];

        return (
          <Sequence
            key={sceneIndex}
            from={startFrame}
            durationInFrames={Math.max(durationFrames, 1)}
          >
            <SceneDisplay
              scene={scene}
              sceneIndex={sceneIndex}
              durationFrames={durationFrames}
              style={style}
              pillColor={pillColor}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

interface SceneDisplayProps {
  scene: Scene;
  sceneIndex: number;
  durationFrames: number;
  style: "brainrot" | "fireship";
  pillColor: string;
}

// Per-word entry animation patterns
function getWordAnimation(
  wordIndex: number,
  progress: number // 0→1 spring progress
): { translateX: number; translateY: number; scale: number } {
  const pattern = wordIndex % 4;
  switch (pattern) {
    case 0: // Slam down from top
      return {
        translateX: 0,
        translateY: interpolate(progress, [0, 1], [-40, 0]),
        scale: interpolate(progress, [0, 0.6, 1], [1.3, 1.05, 1]),
      };
    case 1: // Pop from center
      return {
        translateX: 0,
        translateY: 0,
        scale: interpolate(progress, [0, 0.5, 1], [0.3, 1.08, 1]),
      };
    case 2: // Slide from left
      return {
        translateX: interpolate(progress, [0, 1], [-60, 0]),
        translateY: 0,
        scale: interpolate(progress, [0, 1], [0.9, 1]),
      };
    case 3: // Slide from right
      return {
        translateX: interpolate(progress, [0, 1], [60, 0]),
        translateY: 0,
        scale: interpolate(progress, [0, 1], [0.9, 1]),
      };
    default:
      return { translateX: 0, translateY: 0, scale: 1 };
  }
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({
  scene,
  sceneIndex,
  durationFrames,
  style,
  pillColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000 + scene.startMs;

  const isBrainrot = style === "brainrot";

  // Scene entry — fast fade in
  const entryOpacity = interpolate(frame, [0, 4], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Scene exit — quick fade out
  const exitStart = Math.max(durationFrames - 4, 1);
  const exitOpacity = interpolate(frame, [exitStart, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Flash transition at scene start (white flash, 3 frames)
  const flashOpacity = interpolate(frame, [0, 1, 3], [0.35, 0.2, 0], {
    extrapolateRight: "clamp",
  });

  const combinedOpacity = entryOpacity * exitOpacity;

  return (
    <AbsoluteFill>
      {/* White flash transition */}
      {frame < 3 && (
        <AbsoluteFill
          style={{
            backgroundColor: "#fff",
            opacity: flashOpacity,
            zIndex: 20,
          }}
        />
      )}

      {/* Layer A — Big overlay text (center of screen) */}
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: 0,
          right: 0,
          bottom: "22%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "center",
          gap: "10px 14px",
          padding: "0 5%",
          opacity: combinedOpacity,
        }}
      >
        {scene.wordTimings.map((wt, i) => {
          const isActive = timeMs >= wt.startMs && timeMs < wt.endMs;
          const hasAppeared = timeMs >= wt.startMs;

          // Staggered entry: each word enters 6 frames after the previous
          const wordEntryFrame = i * 6;
          const wordSpring = spring({
            frame: Math.max(0, frame - wordEntryFrame),
            fps,
            config: { damping: 10, mass: 0.35, stiffness: 220 },
          });

          // Get per-word animation pattern
          const anim = getWordAnimation(i, wordSpring);

          // Active word shake effect
          const shakeX =
            isActive && frame > wordEntryFrame + 4
              ? Math.sin(frame * 4) * 3
              : 0;

          const wordOpacity = frame >= wordEntryFrame ? 1 : 0;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translate(${anim.translateX + shakeX}px, ${anim.translateY}px) scale(${anim.scale})`,
                transformOrigin: "center center",
                // Pill highlight on active word
                backgroundColor: isActive ? pillColor : "transparent",
                borderRadius: 10,
                padding: isActive ? "6px 18px" : "6px 8px",
                // Text
                color: "#FFFFFF",
                fontSize: isBrainrot ? 88 : 68,
                fontWeight: 900,
                fontFamily: isBrainrot
                  ? "system-ui, -apple-system, 'Segoe UI', sans-serif"
                  : "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                textTransform: "uppercase",
                lineHeight: 1.1,
                letterSpacing: isBrainrot ? "-0.02em" : "0.02em",
                // Heavy outline via text-shadow
                textShadow:
                  "3px 3px 0 rgba(0,0,0,0.9), -3px -3px 0 rgba(0,0,0,0.9), " +
                  "3px -3px 0 rgba(0,0,0,0.9), -3px 3px 0 rgba(0,0,0,0.9), " +
                  "0 4px 8px rgba(0,0,0,0.7)",
                opacity: wordOpacity,
                transition: "background-color 0.08s",
              }}
            >
              {wt.word}
            </span>
          );
        })}
      </div>

      {/* Layer B — Small subtitle at bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "6%",
          left: "4%",
          right: "4%",
          display: "flex",
          justifyContent: "center",
          opacity: combinedOpacity,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.7)",
            borderRadius: 8,
            padding: "8px 18px",
            maxWidth: "95%",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.9)",
              fontSize: isBrainrot ? 22 : 20,
              fontWeight: 500,
              fontFamily: isBrainrot
                ? "system-ui, -apple-system, sans-serif"
                : "'SF Mono', 'Fira Code', monospace",
              lineHeight: 1.4,
              textAlign: "center",
              margin: 0,
            }}
          >
            {scene.sentence}
          </p>
        </div>
      </div>
    </AbsoluteFill>
  );
};
