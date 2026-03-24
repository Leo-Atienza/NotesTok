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

// 8 word animation patterns — more variety for TikTok feel
function getWordAnimation(
  wordIndex: number,
  progress: number
): { translateX: number; translateY: number; scale: number; rotate: number } {
  const pattern = wordIndex % 8;
  switch (pattern) {
    case 0: // Slam down
      return {
        translateX: 0,
        translateY: interpolate(progress, [0, 1], [-50, 0]),
        scale: interpolate(progress, [0, 0.5, 1], [1.4, 1.05, 1]),
        rotate: 0,
      };
    case 1: // Pop from center
      return {
        translateX: 0,
        translateY: 0,
        scale: interpolate(progress, [0, 0.4, 1], [0.2, 1.15, 1]),
        rotate: 0,
      };
    case 2: // Slide from left
      return {
        translateX: interpolate(progress, [0, 1], [-80, 0]),
        translateY: 0,
        scale: interpolate(progress, [0, 1], [0.85, 1]),
        rotate: 0,
      };
    case 3: // Slide from right
      return {
        translateX: interpolate(progress, [0, 1], [80, 0]),
        translateY: 0,
        scale: interpolate(progress, [0, 1], [0.85, 1]),
        rotate: 0,
      };
    case 4: // Flip in (rotation)
      return {
        translateX: 0,
        translateY: interpolate(progress, [0, 1], [-20, 0]),
        scale: interpolate(progress, [0, 0.5, 1], [0.5, 1.1, 1]),
        rotate: interpolate(progress, [0, 1], [-15, 0]),
      };
    case 5: // Bounce overshoot
      return {
        translateX: 0,
        translateY: interpolate(progress, [0, 0.4, 0.7, 1], [-60, 5, -3, 0]),
        scale: interpolate(progress, [0, 0.4, 0.7, 1], [0.6, 1.1, 0.98, 1]),
        rotate: 0,
      };
    case 6: // Zoom from zero
      return {
        translateX: 0,
        translateY: 0,
        scale: interpolate(progress, [0, 0.5, 1], [0, 1.2, 1]),
        rotate: interpolate(progress, [0, 0.3, 1], [10, -3, 0]),
      };
    case 7: // Rise up
      return {
        translateX: 0,
        translateY: interpolate(progress, [0, 1], [40, 0]),
        scale: interpolate(progress, [0, 0.6, 1], [0.7, 1.05, 1]),
        rotate: 0,
      };
    default:
      return { translateX: 0, translateY: 0, scale: 1, rotate: 0 };
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

  // Scene entry/exit
  const entryOpacity = interpolate(frame, [0, 3], [0, 1], {
    extrapolateRight: "clamp",
  });
  const exitStart = Math.max(durationFrames - 3, 1);
  const exitOpacity = interpolate(frame, [exitStart, durationFrames], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const combinedOpacity = entryOpacity * exitOpacity;

  return (
    <AbsoluteFill>
      {/* Big overlay words — positioned in bottom 35% for image-first layout */}
      <div
        style={{
          position: "absolute",
          top: isBrainrot ? "55%" : "50%",
          left: 0,
          right: 0,
          bottom: isBrainrot ? "8%" : "12%",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "center",
          alignContent: "center",
          gap: "8px 12px",
          padding: "0 5%",
          opacity: combinedOpacity,
        }}
      >
        {scene.wordTimings.map((wt, i) => {
          const isActive = timeMs >= wt.startMs && timeMs < wt.endMs;

          // Faster stagger: 4 frames between words (was 6)
          const wordEntryFrame = i * 4;
          const wordSpring = spring({
            frame: Math.max(0, frame - wordEntryFrame),
            fps,
            config: { damping: 8, mass: 0.3, stiffness: 260 },
          });

          const anim = getWordAnimation(i, wordSpring);

          // Active word pulse
          const pulseScale = isActive
            ? 1 + Math.sin(frame * 6) * 0.03
            : 1;

          const wordOpacity = frame >= wordEntryFrame ? 1 : 0;

          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: `translate(${anim.translateX}px, ${anim.translateY}px) scale(${anim.scale * pulseScale}) rotate(${anim.rotate}deg)`,
                transformOrigin: "center center",
                // Pill highlight on active word with glow
                backgroundColor: isActive ? pillColor : "transparent",
                borderRadius: 12,
                padding: isActive ? "8px 20px" : "6px 8px",
                boxShadow: isActive
                  ? `0 0 24px ${pillColor}80, 0 0 48px ${pillColor}40`
                  : "none",
                // Text
                color: "#FFFFFF",
                fontSize: isBrainrot ? 80 : 64,
                fontWeight: 900,
                fontFamily: isBrainrot
                  ? "system-ui, -apple-system, 'Segoe UI', sans-serif"
                  : "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
                textTransform: "uppercase",
                lineHeight: 1.15,
                letterSpacing: isBrainrot ? "-0.02em" : "0.02em",
                // Heavy text-stroke for readability over images
                textShadow:
                  "3px 3px 0 rgba(0,0,0,1), -3px -3px 0 rgba(0,0,0,1), " +
                  "3px -3px 0 rgba(0,0,0,1), -3px 3px 0 rgba(0,0,0,1), " +
                  "0 0 8px rgba(0,0,0,0.9), 0 4px 12px rgba(0,0,0,0.7)",
                opacity: wordOpacity,
              }}
            >
              {wt.word}
            </span>
          );
        })}
      </div>

      {/* Bottom subtitle — full sentence with word highlight */}
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
