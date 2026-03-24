import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
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
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  scenePhotoUrls?: string[];
}

// Code lines for atmospheric background
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
  backgroundVideoUrl,
  backgroundPhotoUrl,
  scenePhotoUrls = [],
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, 3.2, segment.keyTerms);
  const hasSceneImages = sceneImages.length > 0;

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
  const titleEntryOpacity = interpolate(frame, [5, 15], [0, 1], {
    extrapolateRight: "clamp",
  });
  const titleExitOpacity = interpolate(frame, [35, 45], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const titleOpacity = titleEntryOpacity * titleExitOpacity;

  const badgeOpacity = interpolate(frame, [18, 30], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Current scene for images
  const currentTimeMs = (frame / fps) * 1000;
  let currentSceneIndex = 0;
  for (let i = 0; i < scenes.length; i++) {
    if (currentTimeMs >= scenes[i].startMs) currentSceneIndex = i;
  }

  const currentSceneImage =
    hasSceneImages && sceneImages[currentSceneIndex]
      ? sceneImages[currentSceneIndex]
      : segment.imageUrl || null;

  const prevSceneIndex = Math.max(0, currentSceneIndex - 1);
  const prevSceneImage =
    hasSceneImages && sceneImages[prevSceneIndex]
      ? sceneImages[prevSceneIndex]
      : null;

  const sceneStartFrame = Math.round(
    ((scenes[currentSceneIndex]?.startMs ?? 0) / 1000) * fps
  );
  const transitionProgress = interpolate(
    frame - sceneStartFrame,
    [0, 10],
    [0, 1],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" }
  );

  // Key terms timing
  const keyTermTimings = segment.keyTerms.map((term) => {
    const pos = segment.content.toLowerCase().indexOf(term.toLowerCase());
    if (pos < 0) return durationInFrames * 0.6;
    const wordsBefore = segment.content.slice(0, pos).split(/\s+/).length;
    const totalWords = segment.content.split(/\s+/).length;
    const frac = wordsBefore / totalWords;
    return Math.round(35 + frac * (durationInFrames - 70));
  });

  // Progress bar
  const progressWidth = interpolate(frame, [0, durationInFrames], [0, 100], {
    extrapolateRight: "clamp",
  });

  // Scrolling code
  const codeScrollY = -(frame * 0.6) % (CODE_LINES.length * 28);

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
      {/* === Stock video background (dimmed) === */}
      {backgroundVideoUrl && (
        <AbsoluteFill style={{ opacity: 0.2 }}>
          <OffthreadVideo
            src={backgroundVideoUrl}
            muted
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      )}

      {/* === Scene image behind dark overlay === */}
      {!backgroundVideoUrl && currentSceneImage && (
        <>
          {prevSceneImage &&
            prevSceneImage !== currentSceneImage &&
            transitionProgress < 1 && (
              <AbsoluteFill style={{ opacity: (1 - transitionProgress) * 0.35 }}>
                <img
                  src={prevSceneImage}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              </AbsoluteFill>
            )}
          <AbsoluteFill style={{ opacity: transitionProgress * 0.35 }}>
            <img
              src={currentSceneImage}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        </>
      )}

      {/* Dark overlay to maintain code editor aesthetic */}
      <AbsoluteFill
        style={{
          background: (backgroundVideoUrl || currentSceneImage)
            ? "linear-gradient(160deg, rgba(13,17,23,0.75) 0%, rgba(22,27,34,0.8) 40%, rgba(28,35,51,0.85) 100%)"
            : "transparent",
        }}
      />

      {/* Grid pattern */}
      <AbsoluteFill
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.03) 1px, transparent 0)",
          backgroundSize: "32px 32px",
        }}
      />

      {/* Scrolling code background */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "3%",
          right: "3%",
          height: "100%",
          overflow: "hidden",
          opacity: 0.05,
        }}
      >
        <div
          style={{
            transform: `translateY(${codeScrollY}px)`,
            fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontSize: 14,
            lineHeight: "28px",
            whiteSpace: "pre",
          }}
        >
          {[...CODE_LINES, ...CODE_LINES, ...CODE_LINES].map((line, i) => (
            <div
              key={i}
              style={{
                color:
                  i % 3 === 0
                    ? "#58a6ff"
                    : i % 3 === 1
                      ? "#ffa657"
                      : "#7ee787",
              }}
            >
              {line}
            </div>
          ))}
        </div>
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
          lesson.ts — NotesTok
        </span>
      </div>

      {/* Title section */}
      {frame < 45 && (
        <div
          style={{
            position: "absolute",
            top: "5%",
            left: 0,
            right: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            padding: "0 28px",
            opacity: titleOpacity,
            zIndex: 5,
          }}
        >
          <span
            style={{
              fontSize: 52,
              transform: `scale(${emojiScale})`,
              display: "inline-block",
              marginBottom: 6,
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.3))",
            }}
          >
            {segment.emoji}
          </span>
          <h2
            style={{
              color: "#e6edf3",
              fontSize: 26,
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
              padding: "4px 12px",
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
              fontSize: 11,
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: 1.5,
              opacity: badgeOpacity,
              fontFamily: "'SF Mono', monospace",
            }}
          >
            {segment.type}
          </span>
        </div>
      )}

      {/* Scene-based captions */}
      <AnimatedCaptions scenes={scenes} style="fireship" />

      {/* Key terms badges — typewriter animation */}
      <div
        style={{
          position: "absolute",
          left: "3%",
          top: "38%",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {segment.keyTerms.map((term, i) => {
          const termAppearFrame = keyTermTimings[i];
          const termOpacity =
            frame >= termAppearFrame
              ? interpolate(
                  frame,
                  [termAppearFrame, termAppearFrame + 8],
                  [0, 1],
                  { extrapolateRight: "clamp" }
                )
              : 0;

          // Typewriter: reveal characters one at a time
          const charsElapsed = frame - termAppearFrame;
          const charsToShow = Math.min(
            Math.max(0, Math.floor(charsElapsed / 2)),
            term.length
          );
          const displayText = frame >= termAppearFrame
            ? term.slice(0, charsToShow)
            : "";
          const showCursor = frame >= termAppearFrame && charsToShow < term.length;

          return (
            <span
              key={term}
              style={{
                display: "inline-block",
                transformOrigin: "left center",
                opacity: termOpacity,
                padding: "6px 14px",
                borderRadius: 8,
                backgroundColor: "rgba(88,166,255,0.15)",
                border: "1px solid rgba(88,166,255,0.3)",
                color: "#58a6ff",
                fontSize: 16,
                fontWeight: 700,
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                whiteSpace: "nowrap",
                boxShadow: "0 0 12px rgba(88,166,255,0.15)",
              }}
            >
              {displayText}
              {showCursor && (
                <span style={{ opacity: frame % 15 < 8 ? 1 : 0, color: "#79c0ff" }}>
                  |
                </span>
              )}
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

      {/* Scene counter */}
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
        {currentSceneIndex + 1}/{scenes.length}
      </div>
    </AbsoluteFill>
  );
};
