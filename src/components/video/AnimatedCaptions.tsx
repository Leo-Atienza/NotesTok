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

  // Group chunks (Karaoke: Show 3 words at a time)
  // [prevWord, currentWord, nextWord]
  const currentChunkIndex = Math.floor(displayIndex / 3) * 3;
  const wordChunk = words.slice(currentChunkIndex, currentChunkIndex + 3);

  // Scene transitions
  const exitOpacity = interpolate(frame, [durationFrames - 5, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Calculate spring bound to the *active word*
  const activeWordLocalFrame = Math.round(((activeWord.startMs - scene.startMs) / 1000) * fps);
  
  // AI Story mode has a softer, more cinematic spring
  const wordProgress = spring({
    frame: Math.max(0, frame - activeWordLocalFrame),
    fps,
    config: isAIStory 
      ? { damping: 15, mass: 0.5, stiffness: 200 } // Softer pop
      : { damping: 10, mass: 0.2, stiffness: 350 }, // Extremely fast pop
  });

  const jumpY = interpolate(wordProgress, [0, 0.4, 1], [0, isAIStory ? -10 : -25, 0]);
  const activeScale = interpolate(wordProgress, [0, 0.4, 1], [0.9, isAIStory ? 1.15 : 1.3, 1.1]);

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Centered Dynamic Captions */}
      <div
        style={{
          position: "absolute",
          top: isBrainrot ? "38%" : "50%",
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

          // Karaoke color assignment
          let highlightColor = "#FFFFFF";
          if (isBrainrot) {
            highlightColor = wt.isKeyTerm ? PILL_COLORS[0] : PILL_COLORS[1];
          } else if (isAIStory) {
            highlightColor = wt.isKeyTerm ? "#ffcc00" : "#ffea00"; // Cinematic yellow
          } else if (isWhiteboard) {
            highlightColor = "#111"; // Black sharpie highlight
          } else {
            highlightColor = wt.isKeyTerm ? "#58a6ff" : "#00ff88"; // Fireship
          }

          const color = isThisWordActive ? highlightColor : isPassedOrActive ? (isWhiteboard ? "#111" : "#FFFFFF") : "rgba(128,128,128,0.4)";

          const scale = isThisWordActive ? activeScale : 1;
          const translateY = isThisWordActive ? jumpY : 0;
          const rotate = isThisWordActive && isBrainrot ? (i % 2 === 0 ? 3 : -3) : 0;

          return (
            <div
              key={i}
              style={{
                transform: `scale(${scale}) translateY(${translateY}px) rotate(${rotate}deg)`,
                color: color,
                fontSize: isBrainrot ? 80 : isWhiteboard ? 76 : isAIStory ? 72 : 64,
                fontWeight: 900,
                fontFamily: isAIStory
                  ? "'Lora', 'Georgia', serif" // Cinematic serif for AI stories
                  : isWhiteboard
                    ? "'Caveat', 'Comic Sans MS', cursive, sans-serif"
                    : isBrainrot
                      ? "'Montserrat', 'Arial Black', sans-serif"
                      : "'Fira Code', 'JetBrains Mono', monospace",
                textTransform: isBrainrot ? "uppercase" : "none",
                lineHeight: 1.1,
                letterSpacing: isBrainrot ? "-0.04em" : "0",
                display: "inline-block",
                transformOrigin: "center center",
                WebkitTextStroke: isBrainrot ? "6px black" : isAIStory ? "3px rgba(0,0,0,0.8)" : "none",
                textShadow: isBrainrot 
                  ? "0px 8px 0px rgba(0,0,0,1), 0px 16px 32px rgba(0,0,0,0.8)"
                  : isAIStory
                    ? "0px 4px 16px rgba(0,0,0,0.9), 0px 0px 8px rgba(0,0,0,0.8)"
                    : isWhiteboard
                      ? "none"
                      : "0px 4px 12px rgba(0,0,0,0.8)",
                padding: (isBrainrot || isAIStory || isWhiteboard) ? "4px 8px" : "0",
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
