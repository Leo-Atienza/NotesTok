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
  style: "brainrot" | "fireship";
  pillColor: string;
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({
  scene,
  style,
  pillColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000 + scene.startMs;

  const isBrainrot = style === "brainrot";

  // Scene entry animation — scale in
  const entryScale = spring({
    frame,
    fps,
    config: { damping: 14, mass: 0.5, stiffness: 180 },
  });
  const scaleVal = interpolate(entryScale, [0, 1], [0.85, 1]);
  const entryOpacity = interpolate(entryScale, [0, 1], [0, 1]);

  return (
    <AbsoluteFill>
      {/* Layer A — Big overlay text (center of screen) */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          bottom: "25%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "center",
          gap: "12px 16px",
          padding: "0 5%",
          transform: `scale(${scaleVal})`,
          opacity: entryOpacity,
        }}
      >
        {scene.wordTimings.map((wt, i) => {
          const isActive = timeMs >= wt.startMs && timeMs < wt.endMs;
          const hasAppeared = timeMs >= wt.startMs;

          // Per-word pop animation
          const wordStartLocalFrame = Math.round(
            ((wt.startMs - scene.startMs) / 1000) * fps
          );
          const wordPop = spring({
            frame: Math.max(0, frame - wordStartLocalFrame),
            fps,
            config: { damping: 10, mass: 0.4, stiffness: 200 },
          });
          const wordScale = isActive
            ? interpolate(wordPop, [0, 1], [0.9, 1.05])
            : hasAppeared
              ? 1
              : 0.8;
          const wordOpacity = hasAppeared ? 1 : 0.3;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `scale(${wordScale})`,
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
                transition: "background-color 0.1s",
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
          left: "5%",
          right: "5%",
          display: "flex",
          justifyContent: "center",
          opacity: entryOpacity,
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
