import React from "react";
import {
  AbsoluteFill,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import type { Segment } from "@/lib/types";

interface FireshipModeProps {
  segment: Segment;
  sceneImages?: string[];
}

// Fake code lines that scroll in the background for the "code editor" feel
const CODE_LINES = [
  "import { Revolution } from './history';",
  "const causes = analyze(events);",
  "function explain(concept) {",
  "  return concept.simplify();",
  "}",
  "// key insight below ↓",
  "export default lesson;",
  "const quiz = generateQuiz(data);",
  "await brain.process(knowledge);",
  "if (understood) return nextTopic();",
  "class StudySession {",
  "  constructor(notes) {",
  "    this.topics = extract(notes);",
  "  }",
  "}",
  "const recall = spaced(intervals);",
];

export const FireshipMode: React.FC<FireshipModeProps> = ({
  segment,
  sceneImages = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, 2.8, segment.keyTerms);
  const hasSceneImages = sceneImages.length > 0;
  const hasSingleImage = !!segment.imageUrl;

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
  const titleEntryOpacity = interpolate(frame, [5, 18], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleExitOpacity = interpolate(frame, [40, 55], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleExitY = interpolate(frame, [40, 55], [0, -50], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

  const badgeOpacity = interpolate(frame, [20, 35], [0, 1], {
    extrapolateRight: "clamp",
  });
  const lineWidth = interpolate(frame, [30, 48], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Accent glows
  const glow1X = Math.sin(frame / 60) * 30;
  const glow1Y = Math.cos(frame / 60) * 20;
  const glow2X = Math.cos(frame / 50) * 15;
  const glow2Y = Math.sin(frame / 50) * 25;

  // Current scene for images
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }

  const currentSceneImage =
    hasSceneImages && sceneImages[currentSceneIndex]
      ? sceneImages[currentSceneIndex]
      : hasSingleImage
        ? segment.imageUrl!
        : null;

  // Image card animations
  const imageSlide = spring({
    frame: Math.max(0, frame - 12),
    fps,
    config: { damping: 14, mass: 0.7 },
  });
  const imageX = interpolate(imageSlide, [0, 1], [120, 0]);
  const imageEntryOpacity = interpolate(imageSlide, [0, 1], [0, 1]);
  const imageFloat = Math.sin(frame / 40) * 3;
  const imageFadeOpacity = interpolate(frame, [55, 75], [1, 0.2], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const borderGlow = 0.15 + 0.1 * Math.sin(frame / 20);

  // Key terms timing
  const keyTermTimings = segment.keyTerms.map((term) => {
    const pos = segment.content.toLowerCase().indexOf(term.toLowerCase());
    if (pos < 0) return durationInFrames * 0.6;
    const wordsBefore = segment.content.slice(0, pos).split(/\s+/).length;
    const totalWords = segment.content.split(/\s+/).length;
    const frac = wordsBefore / totalWords;
    return Math.round(40 + frac * (durationInFrames - 80));
  });

  // Progress bar
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Scrolling code lines offset
  const codeScrollY = -(frame * 0.8) % (CODE_LINES.length * 28);

  return (
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(160deg, #0d1117 0%, #161b22 40%, #1c2333 100%)",
        overflow: "hidden",
      }}
    >
      {/* Subtle grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scrolling code background — faint, atmospheric */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "3%",
          right: "3%",
          height: "100%",
          overflow: "hidden",
          opacity: 0.06,
        }}
      >
        <div
          style={{
            transform: `translateY(${codeScrollY}px)`,
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: 14,
            lineHeight: "28px",
            color: "#58a6ff",
            whiteSpace: "pre",
          }}
        >
          {[...CODE_LINES, ...CODE_LINES, ...CODE_LINES].map((line, i) => (
            <div key={i} style={{ color: i % 3 === 0 ? "#58a6ff" : i % 3 === 1 ? "#ffa657" : "#7ee787" }}>
              {line}
            </div>
          ))}
        </div>
      </div>

      {/* Animated accent glows */}
      <div
        style={{
          position: "absolute",
          top: -100 + glow1Y,
          right: -100 + glow1X,
          width: 350,
          height: 350,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(88,166,255,0.12) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -80 + glow2Y,
          left: -80 + glow2X,
          width: 280,
          height: 280,
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(255,166,87,0.08) 0%, transparent 70%)",
          filter: "blur(20px)",
        }}
      />
      {/* Center accent glow — follows scene color */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(88,166,255,${0.04 + Math.sin(frame / 30) * 0.02}) 0%, transparent 70%)`,
          transform: "translate(-50%, -50%)",
          filter: "blur(40px)",
        }}
      />

      {/* Editor chrome — top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 36,
          background: "rgba(13,17,23,0.9)",
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
          lesson.ts — NotesTok
        </span>
      </div>

      {/* Title section */}
      {frame < 55 && (
        <div
          style={{
            position: "absolute",
            top: "6%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 28px",
            opacity: titleOpacity,
            transform: `translateY(${titleExitY}px)`,
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 56,
              transform: `scale(${emojiScale})`,
              display: "inline-block",
              marginBottom: 8,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#e6edf3",
              fontSize: 28,
              fontWeight: 800,
              textAlign: "center",
              transform: `translateX(${titleSlideX}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.25,
              maxWidth: "90%",
              margin: 0,
            }}
          >
            {segment.title}
          </h2>
          <span
            style={{
              marginTop: 8,
              padding: "4px 14px",
              borderRadius: 6,
              backgroundColor:
                segment.type === "concept"
                  ? "rgba(88,166,255,0.15)"
                  : segment.type === "example"
                    ? "rgba(255,166,87,0.15)"
                    : "rgba(87,255,166,0.15)",
              color:
                segment.type === "concept"
                  ? "#58a6ff"
                  : segment.type === "example"
                    ? "#ffa657"
                    : "#57ffaa",
              fontSize: 12,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              opacity: badgeOpacity,
              fontFamily: "'SF Mono', 'Fira Code', monospace",
            }}
          >
            {segment.type}
          </span>
          <div
            style={{
              marginTop: 14,
              height: 2,
              width: `${lineWidth}%`,
              maxWidth: 250,
              background:
                "linear-gradient(90deg, transparent, #58a6ff, transparent)",
              borderRadius: 1,
            }}
          />
        </div>
      )}

      {/* Per-scene image card */}
      {currentSceneImage && (
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "50%",
            transform: `translateX(calc(-50% + ${imageX}px)) translateY(${imageFloat}px)`,
            opacity: imageEntryOpacity * imageFadeOpacity,
            width: "65%",
            maxWidth: 700,
            aspectRatio: "16/9",
            borderRadius: 14,
            overflow: "hidden",
            border: `1px solid rgba(88,166,255,${borderGlow})`,
            boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 20px rgba(88,166,255,${borderGlow * 0.5})`,
          }}
        >
          <Img
            src={currentSceneImage}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      )}

      {/* Scene-based captions */}
      <AnimatedCaptions scenes={scenes} style="fireship" />

      {/* Key terms badges */}
      <div
        style={{
          position: "absolute",
          left: "3%",
          top: "42%",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {segment.keyTerms.map((term, i) => {
          const termAppearFrame = keyTermTimings[i];
          const termScale = spring({
            frame: Math.max(0, frame - termAppearFrame),
            fps,
            config: { damping: 10, mass: 0.4 },
          });
          const termOpacity =
            frame >= termAppearFrame
              ? interpolate(
                  frame,
                  [termAppearFrame, termAppearFrame + 10],
                  [0, 1],
                  { extrapolateRight: "clamp" }
                )
              : 0;

          return (
            <span
              key={term}
              style={{
                display: "inline-block",
                transform: `scale(${termScale})`,
                transformOrigin: "left center",
                opacity: termOpacity,
                padding: "4px 10px",
                borderRadius: 6,
                backgroundColor: "rgba(88,166,255,0.12)",
                border: "1px solid rgba(88,166,255,0.25)",
                color: "#58a6ff",
                fontSize: 12,
                fontWeight: 600,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                whiteSpace: "nowrap",
              }}
            >
              {term}
            </span>
          );
        })}
      </div>

      {/* Progress bar */}
      <div
        style={{
          position: "absolute",
          top: 36,
          left: 0,
          height: 2,
          width: `${progressWidth}%`,
          background: "linear-gradient(90deg, #58a6ff, #79c0ff)",
          borderRadius: "0 1px 1px 0",
          zIndex: 10,
          boxShadow: "0 0 8px rgba(88,166,255,0.4)",
        }}
      />

      {/* Segment counter */}
      <div
        style={{
          position: "absolute",
          top: 48,
          right: "4%",
          padding: "4px 10px",
          borderRadius: 6,
          backgroundColor: "rgba(48,54,61,0.6)",
          border: "1px solid rgba(48,54,61,0.8)",
          color: "rgba(230,237,243,0.6)",
          fontSize: 11,
          fontWeight: 600,
          fontFamily: "'SF Mono', monospace",
          zIndex: 10,
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};
