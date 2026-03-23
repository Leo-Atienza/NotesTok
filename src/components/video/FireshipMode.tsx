import React from "react";
import {
  AbsoluteFill,
  Sequence,
  Img,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
} from "remotion";
import type { Segment } from "@/lib/types";

interface FireshipModeProps {
  segment: Segment;
}

export const FireshipMode: React.FC<FireshipModeProps> = ({ segment }) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const content = segment.content;
  const hasImage = !!segment.imageUrl;

  // --- Title sequence (frames 0-50) ---
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

  const titleOpacity = interpolate(frame, [5, 20], [0, 1], {
    extrapolateRight: "clamp",
  });

  const badgeOpacity = interpolate(frame, [25, 40], [0, 1], {
    extrapolateRight: "clamp",
  });

  // Image reveal
  const imageOpacity = interpolate(frame, [15, 35], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const imageScale = spring({
    frame: Math.max(0, frame - 15),
    fps,
    config: { damping: 14, mass: 0.6 },
  });

  // Horizontal line wipe
  const lineWidth = interpolate(frame, [35, 55], [0, 100], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // --- Content sequence (frames 50+) ---
  const contentStartFrame = 50;
  const contentEndBuffer = 40; // frames for key terms display
  const availableContentFrames = durationInFrames - contentStartFrame - contentEndBuffer;
  const charsPerFrame = content.length / Math.max(availableContentFrames, 1);
  const revealedChars =
    frame > contentStartFrame
      ? Math.min(
          content.length,
          Math.floor((frame - contentStartFrame) * charsPerFrame)
        )
      : 0;
  const revealedText = content.slice(0, revealedChars);

  // Cursor blink
  const cursorVisible =
    revealedChars < content.length &&
    frame > contentStartFrame &&
    frame % 30 < 18;

  // Key terms timing
  const contentDoneFrame =
    contentStartFrame + Math.ceil(content.length / charsPerFrame);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(160deg, #0d1117 0%, #161b22 40%, #1c2333 100%)",
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

      {/* Accent glow in top corner */}
      <div
        style={{
          position: "absolute",
          top: -100,
          right: -100,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(88,166,255,0.08) 0%, transparent 70%)",
        }}
      />

      {/* Title section */}
      <Sequence from={0} durationInFrames={durationInFrames}>
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
          }}
        >
          {/* Emoji */}
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

          {/* Title */}
          <h2
            style={{
              color: "#e6edf3",
              fontSize: 28,
              fontWeight: 800,
              textAlign: "center",
              opacity: titleOpacity,
              transform: `translateX(${titleSlideX}px)`,
              fontFamily: "system-ui, -apple-system, sans-serif",
              lineHeight: 1.25,
              maxWidth: "90%",
            }}
          >
            {segment.title}
          </h2>

          {/* Type badge */}
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

          {/* Horizontal line wipe */}
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
      </Sequence>

      {/* AI-generated image (if available) — shown as inset card */}
      {hasImage && (
        <div
          style={{
            position: "absolute",
            top: "28%",
            left: "50%",
            transform: `translateX(-50%) scale(${imageScale})`,
            opacity: imageOpacity,
            width: "85%",
            maxWidth: 900,
            aspectRatio: "16/9",
            borderRadius: 12,
            overflow: "hidden",
            border: "1px solid rgba(48,54,61,0.6)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(88,166,255,0.1)",
          }}
        >
          <Img
            src={segment.imageUrl!}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>
      )}

      {/* Content area — typewriter effect (positioned below image or in center) */}
      <Sequence
        from={contentStartFrame}
        durationInFrames={durationInFrames - contentStartFrame}
      >
        <div
          style={{
            position: "absolute",
            top: hasImage ? "58%" : "32%",
            left: 0,
            right: 0,
            padding: "0 28px",
          }}
        >
          {/* Code-editor style container */}
          <div
            style={{
              backgroundColor: "rgba(13,17,23,0.85)",
              border: "1px solid rgba(48,54,61,0.7)",
              borderRadius: 10,
              padding: "20px 22px",
              position: "relative",
              backdropFilter: "blur(8px)",
            }}
          >
            {/* Editor dots */}
            <div
              style={{
                display: "flex",
                gap: 5,
                position: "absolute",
                top: 10,
                left: 14,
              }}
            >
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#ff5f57" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#febc2e" }} />
              <div style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: "#28c840" }} />
            </div>

            <p
              style={{
                color: "#c9d1d9",
                fontSize: 18,
                lineHeight: 1.65,
                fontFamily: "'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace",
                margin: 0,
                marginTop: 16,
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
              }}
            >
              <HighlightedText
                text={revealedText}
                keyTerms={segment.keyTerms}
                frame={frame}
                fps={fps}
                contentStartFrame={contentStartFrame}
              />
              {cursorVisible && (
                <span style={{ color: "#58a6ff", fontWeight: 300 }}>|</span>
              )}
            </p>
          </div>
        </div>
      </Sequence>

      {/* Key terms badges */}
      {frame > contentDoneFrame && segment.keyTerms.length > 0 && (
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: 0,
            right: 0,
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "center",
            gap: 8,
            padding: "0 20px",
          }}
        >
          {segment.keyTerms.map((term, i) => {
            const termScale = spring({
              frame: Math.max(0, frame - contentDoneFrame - i * 6),
              fps,
              config: { damping: 10, mass: 0.4 },
            });

            return (
              <span
                key={term}
                style={{
                  display: "inline-block",
                  transform: `scale(${termScale})`,
                  transformOrigin: "center",
                  padding: "5px 12px",
                  borderRadius: 6,
                  backgroundColor: "rgba(88,166,255,0.12)",
                  border: "1px solid rgba(88,166,255,0.3)",
                  color: "#58a6ff",
                  fontSize: 13,
                  fontWeight: 600,
                  fontFamily: "'SF Mono', 'Fira Code', monospace",
                }}
              >
                {term}
              </span>
            );
          })}
        </div>
      )}

      {/* Segment counter */}
      <div
        style={{
          position: "absolute",
          top: "3%",
          right: "5%",
          padding: "5px 12px",
          borderRadius: 6,
          backgroundColor: "rgba(48,54,61,0.5)",
          color: "rgba(230,237,243,0.6)",
          fontSize: 12,
          fontWeight: 600,
          fontFamily: "'SF Mono', monospace",
        }}
      >
        {segment.order + 1}
      </div>
    </AbsoluteFill>
  );
};

/**
 * Renders text with key terms highlighted inline.
 */
const HighlightedText: React.FC<{
  text: string;
  keyTerms: string[];
  frame: number;
  fps: number;
  contentStartFrame: number;
}> = ({ text, keyTerms, frame, fps, contentStartFrame }) => {
  if (!keyTerms.length) return <>{text}</>;

  const regex = new RegExp(
    `(${keyTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, i) => {
        const isKeyTerm = keyTerms.some(
          (t) => t.toLowerCase() === part.toLowerCase()
        );
        if (isKeyTerm) {
          const charPos = text.indexOf(part);
          const termRevealFrame =
            contentStartFrame + Math.floor(charPos * 0.5);
          const pop = spring({
            frame: Math.max(0, frame - termRevealFrame),
            fps,
            config: { damping: 12, mass: 0.3 },
          });

          return (
            <span
              key={i}
              style={{
                color: "#58a6ff",
                fontWeight: 700,
                display: "inline-block",
                transform: `scale(${Math.min(pop * 1.05, 1.05)})`,
                textShadow: "0 0 8px rgba(88,166,255,0.4)",
              }}
            >
              {part}
            </span>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
};
