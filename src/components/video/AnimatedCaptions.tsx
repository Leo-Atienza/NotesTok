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

// Brainrot Highlight Colors (Intense neon)
const PILL_COLORS = ["#ffea00", "#00ff88", "#ff00dd", "#00eeff"];

interface AnimatedCaptionsProps {
  scenes: Scene[];
  style?: "brainrot" | "fireship" | "aistory" | "whiteboard";
}

export const AnimatedCaptions: React.FC<AnimatedCaptionsProps> = ({
  scenes,
  style = "brainrot",
}) => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {scenes.map((scene, sceneIndex) => {
        const startFrame = Math.floor((scene.startMs / 1000) * fps);
        const durationFrames = Math.ceil(
          ((scene.endMs - scene.startMs) / 1000) * fps
        ) + Math.round(fps * 0.5); // hold an extra half second at end of scene

        return (
          <Sequence
            key={sceneIndex}
            from={Math.max(0, startFrame)}
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
  style: "brainrot" | "fireship" | "aistory" | "whiteboard";
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
  const isAIStory = style === "aistory";
  const isWhiteboard = style === "whiteboard";
  const words = scene.allWordTimings;
  if (!words || words.length === 0) return null;

  // Active Word Detection
  const activeIndex = words.findIndex((wt) => timeMs >= wt.startMs && timeMs < wt.endMs);
  const displayIndex = activeIndex >= 0 ? activeIndex : words.length - 1;
  const activeWord = words[displayIndex];

  // Group chunks — brainrot shows 3 words for fast reading, others 3
  const chunkSize = isBrainrot ? 3 : 3;
  const currentChunkIndex = Math.floor(displayIndex / chunkSize) * chunkSize;
  const wordChunk = words.slice(currentChunkIndex, currentChunkIndex + chunkSize);

  // Scene transitions
  const exitOpacity = interpolate(frame, [durationFrames - 5, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate spring bound to the *active word*
  const activeWordLocalFrame = Math.round(((activeWord.startMs - scene.startMs) / 1000) * fps);

  // Brainrot: aggressive slam spring. AI Story: softer cinematic. Others: fast pop.
  const wordProgress = spring({
    frame: Math.max(0, frame - activeWordLocalFrame),
    fps,
    config: isBrainrot
      ? { damping: 8, mass: 0.6, stiffness: 400 }  // Word-slam: heavy impact
      : isAIStory
        ? { damping: 15, mass: 0.5, stiffness: 200 } // Softer pop
        : { damping: 10, mass: 0.2, stiffness: 350 }, // Fast pop
  });

  // Brainrot: word slams down from above with camera shake
  const brainrotSlamY = interpolate(wordProgress, [0, 0.3, 0.6, 1], [-60, 5, -3, 0]);
  const brainrotShakeX = isBrainrot && wordProgress > 0.2 && wordProgress < 0.5
    ? Math.sin(frame * 8) * 3 : 0;

  const jumpY = isBrainrot
    ? brainrotSlamY
    : interpolate(wordProgress, [0, 0.4, 1], [0, isAIStory ? -10 : -25, 0]);
  const activeScale = isBrainrot
    ? interpolate(wordProgress, [0, 0.3, 0.6, 1], [1.5, 1.1, 1.05, 1.0])
    : interpolate(wordProgress, [0, 0.4, 1], [0.9, isAIStory ? 1.15 : 1.3, 1.1]);

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Centered Dynamic Captions */}
      <div
        style={{
          position: "absolute",
          top: isBrainrot ? "35%" : "50%",
          left: 0,
          right: 0,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          flexWrap: "wrap",
          padding: "0 10%",
          gap: isBrainrot ? "16px" : "12px",
        }}
      >
        {wordChunk.map((wt, i) => {
          const isThisWordActive = wt.startMs === activeWord.startMs;
          const isPassedOrActive = timeMs >= wt.startMs;

          // Color assignment per mode
          let highlightColor = "#FFFFFF";
          if (isBrainrot) {
            highlightColor = "#FFE500"; // ALWAYS bright yellow for active word in brainrot
          } else if (isAIStory) {
            highlightColor = wt.isKeyTerm ? "#ffcc00" : "#ffea00";
          } else if (isWhiteboard) {
            highlightColor = "#111";
          } else {
            highlightColor = wt.isKeyTerm ? "#58a6ff" : "#00ff88";
          }

          const color = isThisWordActive
            ? highlightColor
            : isPassedOrActive
              ? (isWhiteboard ? "#111" : isBrainrot ? "rgba(255,255,255,0.85)" : "#FFFFFF")
              : "rgba(128,128,128,0.3)";

          const scale = isThisWordActive ? activeScale : 1;
          const translateY = isThisWordActive ? jumpY : 0;
          const translateX = isThisWordActive ? brainrotShakeX : 0;
          const rotate = isThisWordActive && isBrainrot ? (i % 2 === 0 ? 2 : -2) : 0;

          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale}) translateY(${translateY}px) translateX(${translateX}px) rotate(${rotate}deg)`,
                color: color,
                fontSize: isBrainrot ? 68 : isWhiteboard ? 76 : isAIStory ? 72 : 64,
                fontWeight: 900,
                fontFamily: isBrainrot
                  ? "'Impact', 'Arial Black', sans-serif"
                  : isAIStory
                    ? "'Lora', 'Georgia', serif"
                    : isWhiteboard
                      ? "'Caveat', 'Comic Sans MS', cursive, sans-serif"
                      : "'Fira Code', 'JetBrains Mono', monospace",
                textTransform: isBrainrot ? "uppercase" : "none",
                lineHeight: 1.1,
                letterSpacing: isBrainrot ? "0.02em" : "0",
                display: "inline-block",
                transformOrigin: "center center",
                WebkitTextStroke: isBrainrot
                  ? "4px #000000"
                  : isAIStory ? "3px rgba(0,0,0,0.8)" : "none",
                textShadow: isBrainrot
                  ? "0px 6px 0px rgba(0,0,0,0.9), 0px 12px 24px rgba(0,0,0,0.7)"
                  : isAIStory
                    ? "0px 4px 16px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.8)"
                    : isWhiteboard
                      ? "none"
                      : "0px 4px 12px rgba(0,0,0,0.8)",
                padding: (isBrainrot || isAIStory || isWhiteboard) ? "4px 12px" : "0",
                transition: isThisWordActive ? "none" : "color 0.1s",
              }}
            >
              {wt.word}
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
