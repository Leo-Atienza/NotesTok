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

// Pill highlight colors — vibrant, high contrast
const PILL_COLORS = ["#ef4444", "#22c55e", "#eab308", "#3b82f6", "#ec4899", "#f97316", "#06b6d4"];

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
}

const SceneDisplay: React.FC<SceneDisplayProps> = ({
  scene,
  sceneIndex,
  durationFrames,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const timeMs = (frame / fps) * 1000 + scene.startMs;

  const isBrainrot = style === "brainrot";
  const words = scene.allWordTimings;

  // Find the currently active word
  const activeWordIndex = words.findIndex(
    (wt) => timeMs >= wt.startMs && timeMs < wt.endMs
  );
  // If past all words, show the last one (hold phase)
  const displayIndex = activeWordIndex >= 0 ? activeWordIndex : words.length - 1;
  const activeWord = words[displayIndex];

  if (!activeWord) return null;

  // Scene entry/exit fade
  const entryOpacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });
  const exitStart = Math.max(durationFrames - 3, 1);
  const exitOpacity = interpolate(frame, [exitStart, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const combinedOpacity = entryOpacity * exitOpacity;

  // Word entry animation — spring scale
  const wordLocalFrame = Math.round(((activeWord.startMs - scene.startMs) / 1000) * fps);
  const wordProgress = spring({
    frame: Math.max(0, frame - wordLocalFrame),
    fps,
    config: { damping: 8, mass: 0.3, stiffness: 280 },
  });

  const wordScale = interpolate(wordProgress, [0, 0.5, 1], [0.3, 1.15, 1]);

  // Subtle shake on active word
  const shakeX = activeWordIndex >= 0 ? Math.sin(frame * 0.8) * 3 : 0;

  // Color cycling
  const pillColor = PILL_COLORS[(sceneIndex * 3 + displayIndex) % PILL_COLORS.length];

  return (
    <AbsoluteFill>
      {/* Big single word — centered at ~40% from top */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: 0,
          right: 0,
          bottom: "30%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: combinedOpacity,
        }}
      >
        <span
          style={{
            display: "inline-block",
            transform: `scale(${wordScale}) translateX(${shakeX}px)`,
            transformOrigin: "center center",
            // Key terms get colored pill, others get clean white
            backgroundColor: activeWord.isKeyTerm ? pillColor : "transparent",
            borderRadius: 16,
            padding: activeWord.isKeyTerm ? "12px 32px" : "8px 16px",
            boxShadow: activeWord.isKeyTerm
              ? `0 0 30px ${pillColor}80, 0 0 60px ${pillColor}40`
              : "none",
            // Text
            color: "#FFFFFF",
            fontSize: isBrainrot ? 110 : 90,
            fontWeight: 900,
            fontFamily: isBrainrot
              ? "system-ui, -apple-system, 'Segoe UI', sans-serif"
              : "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            textTransform: "uppercase",
            lineHeight: 1.1,
            letterSpacing: isBrainrot ? "-0.03em" : "0.02em",
            // Heavy text-stroke for readability over any background
            textShadow:
              "4px 4px 0 rgba(0,0,0,1), -4px -4px 0 rgba(0,0,0,1), " +
              "4px -4px 0 rgba(0,0,0,1), -4px 4px 0 rgba(0,0,0,1), " +
              "0 0 12px rgba(0,0,0,0.9), 0 6px 16px rgba(0,0,0,0.7)",
          }}
        >
          {activeWord.word}
        </span>
      </div>

      {/* Bottom subtitle — full sentence for context */}
      <div
        style={{
          position: "absolute",
          bottom: isBrainrot ? "2%" : "4%",
          left: "3%",
          right: "3%",
          display: "flex",
          justifyContent: "center",
          opacity: combinedOpacity * 0.95,
        }}
      >
        <div
          style={{
            backgroundColor: "rgba(0,0,0,0.75)",
            borderRadius: 10,
            padding: "10px 20px",
            maxWidth: "95%",
            backdropFilter: "blur(4px)",
          }}
        >
          <p
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: isBrainrot ? 24 : 22,
              fontWeight: 600,
              fontFamily: isBrainrot
                ? "system-ui, -apple-system, sans-serif"
                : "'SF Mono', 'Fira Code', monospace",
              lineHeight: 1.5,
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
