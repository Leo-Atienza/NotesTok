import React from "react";
import { AbsoluteFill, OffthreadVideo, interpolate, useCurrentFrame, useVideoConfig } from "remotion";

interface BackgroundLayerProps {
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  currentScenePhoto?: string | null;
  currentSceneImage?: string | null;
  prevScenePhoto?: string | null;
  prevSceneImage?: string | null;
  camera: { scale: number; x: number; y: number; rotate: number };
  sceneProgress: number;
  transitionProgress: number;
  theme: { bg: string[]; accent: string };
  gradientAngle: number;
}

export const BackgroundLayer: React.FC<BackgroundLayerProps> = ({
  backgroundVideoUrl,
  backgroundPhotoUrl,
  currentScenePhoto,
  currentSceneImage,
  prevScenePhoto,
  prevSceneImage,
  camera,
  sceneProgress,
  transitionProgress,
  theme,
  gradientAngle,
}) => {
  const frame = useCurrentFrame();
  const hasVideo = !!backgroundVideoUrl;
  const hasPhoto = currentScenePhoto || backgroundPhotoUrl;
  const hasImage = currentSceneImage;

  if (hasVideo) {
    return (
      <AbsoluteFill>
        <OffthreadVideo
          src={backgroundVideoUrl!}
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      </AbsoluteFill>
    );
  }

  if (hasPhoto || hasImage) {
    return (
      <>
        {(prevScenePhoto || prevSceneImage) && transitionProgress < 1 && (
          <AbsoluteFill style={{ opacity: 1 - transitionProgress }}>
            <img
              src={(prevScenePhoto || prevSceneImage)!}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          </AbsoluteFill>
        )}
        <AbsoluteFill
          style={{
            transform: `scale(${1 + (camera.scale - 1) * sceneProgress}) translate(${camera.x * sceneProgress * 0.5}px, ${camera.y * sceneProgress * 0.5}px) rotate(${(camera.rotate ?? 0) * sceneProgress}deg)`,
            opacity: (prevScenePhoto || prevSceneImage) && transitionProgress < 1 ? transitionProgress : 1,
          }}
        >
          <img
            src={(currentScenePhoto || backgroundPhotoUrl || currentSceneImage)!}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </AbsoluteFill>
      </>
    );
  }

  // Fallback: gradient + blurred blobs
  return (
    <>
      <AbsoluteFill
        style={{
          background: `linear-gradient(${gradientAngle}deg, ${theme.bg[0]} 0%, ${theme.bg[1]} 50%, ${theme.bg[2]} 100%)`,
        }}
      />
      {[0, 1, 2].map((i) => {
        const x = 20 + i * 30 + Math.sin(frame * 0.005 + i * 2) * 12;
        const y = 25 + i * 20 + Math.cos(frame * 0.004 + i) * 10;
        const size = 300 + i * 100;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${theme.accent}30 0%, transparent 70%)`,
              transform: "translate(-50%, -50%)",
              filter: "blur(60px)",
              opacity: 0.6,
            }}
          />
        );
      })}
      <AbsoluteFill
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`,
          opacity: 0.5,
        }}
      />
    </>
  );
};
