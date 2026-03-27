import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Video,
  Audio,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

interface FireshipModeProps {
  segment: Segment;
  sceneImages?: string[];
}

const FALLBACK_CODE = [
  "import { Revolution } from './history';",
  "const causes = analyze(events);",
  "function explain(concept) {",
  "  return concept.simplify();",
  "}",
  "export default lesson;",
];

export const FireshipMode: React.FC<FireshipModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, segment.keyTerms, segment.voiceoverTimings);
  const codeLines = segment.codeSnippet?.code.split('\n') || FALLBACK_CODE;

  // Title animations
  const emojiScale = spring({
    frame,
    fps,
    config: { damping: 8, mass: 0.4, stiffness: 200 },
  });
  const titleSlideX = interpolate(
    spring({ frame: Math.max(0, frame - 5), fps, config: { damping: 12 } }),
    [0, 1],
    [-300, 0]
  );
  
  // Quick snappy meme pop-in (Fireship style)
  const memeGif = segment.scoutedMemeUrl;
  const showMeme = frame > 30 && frame < durationInFrames - 30; // Show in middle
  // Snap zoom in for meme
  const memeScale = spring({
    frame: Math.max(0, frame - 30),
    fps,
    config: { damping: 10, stiffness: 300, mass: 0.5 },
  });

  // Progress bar
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Accent glows
  const glow1X = Math.sin(frame / 60) * 25;
  const glow1Y = Math.cos(frame / 60) * 15;

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #161b22 40%, #1c2333 100%)",
        overflow: "hidden",
      }}
    >
      {/* Segment SFX (Cauldron Integration) */}
      {segment.sfxUrl && <Audio src={segment.sfxUrl} volume={0.6} />}

      {/* Grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Editor chrome */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 36,
          background: "rgba(13,17,23,0.95)",
          borderBottom: "1px solid rgba(48,54,61,0.6)",
          display: "flex",
          alignItems: "center",
          padding: "0 14px",
          gap: 8,
          zIndex: 8,
        }}
      >
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#28c840" }} />
        <span
          style={{
            marginLeft: 12,
            fontSize: 11,
            color: "rgba(139,148,158,0.7)",
            fontFamily: "'SF Mono', monospace",
          }}
        >
          {segment.codeSnippet?.language ? `lesson.${segment.codeSnippet.language}` : "lesson.ts"} — NotesTok
        </span>
      </div>

      {/* Typewriter Code Snippet */}
      <div
        style={{
          position: "absolute",
          top: "10%",
          left: "5%",
          right: "5%",
          fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
          fontSize: 22,
          lineHeight: "34px",
          whiteSpace: "pre-wrap",
          color: "#e6edf3",
          zIndex: 2,
        }}
      >
        {codeLines.map((line, lineIndex) => {
          // Calculate when this line should start typing
          // Assume 5 frames per character typing speed
          const charsBeforeThisLine = codeLines.slice(0, lineIndex).join("").length;
          const lineStartFrame = charsBeforeThisLine * 2;
          
          const charsElapsed = Math.max(0, frame - lineStartFrame);
          const charsToShow = Math.floor(charsElapsed / 2);
          
          if (charsToShow <= 0) return null;
          
          const text = line.slice(0, Math.min(charsToShow, line.length));
          const isTyping = charsToShow > 0 && charsToShow < line.length;

          // Syntax highlighting colors based on line index for flare
          const color = lineIndex % 3 === 0 ? "#58a6ff" : lineIndex % 3 === 1 ? "#ffa657" : "#7ee787";

          return (
            <div key={lineIndex} style={{ color }}>
              {text}
              {isTyping && <span style={{ color: "#fff", opacity: frame % 10 < 5 ? 1 : 0 }}>|</span>}
            </div>
          );
        })}
      </div>

      {/* Accent glows */}
      <div
        style={{
          position: "absolute",
          top: -100 + glow1Y,
          right: -100 + glow1X,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(88,166,255,0.1) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />

      {/* Quick Snappy Meme Pop-In (Bottom Right) */}
      {memeGif && showMeme && (
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            right: "5%",
            width: "45%",
            height: "25%",
            transform: `scale(${memeScale}) rotate(${Math.sin(frame / 5) * 5}deg)`,
            border: "4px solid rgba(255,255,255,0.1)",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            zIndex: 15,
          }}
        >
          <Video src={memeGif} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      {/* Title section (Top Left Overlay) */}
      {frame < 60 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "5%",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            opacity: interpolate(frame, [45, 60], [1, 0], { extrapolateRight: "clamp" }),
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 64,
              transform: `scale(${emojiScale})`,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.5))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#e6edf3",
              fontSize: 32,
              fontWeight: 800,
              transform: `translateX(${titleSlideX}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.1,
              marginTop: 10,
              textShadow: "0 4px 12px rgba(0,0,0,0.8)",
            }}
          >
            {segment.title}
          </h2>
        </div>
      )}

      {/* Captions */}
      <AnimatedCaptions scenes={scenes} style="fireship" />

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 0,
          height: 3,
          width: `${progressWidth}%`,
          background: "linear-gradient(90deg, #58a6ff, #7ee787)",
          zIndex: 10,
        }}
      />
    </AbsoluteFill>
  );
};
