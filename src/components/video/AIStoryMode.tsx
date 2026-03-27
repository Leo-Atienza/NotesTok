import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  Audio,
  interpolate,
} from "remotion";
import type { Segment } from "@/lib/types";
import { AnimatedCaptions } from "./AnimatedCaptions";
import { generateSceneData } from "./CaptionEngine";
import type { ResolvedSegmentResources } from "@/lib/media-types";

interface AIStoryModeProps {
  segment: Segment;
  sceneImages?: string[];
  scenePhotoUrls?: string[];
  voiceoverUrl?: string;
  backgroundMusicUrl?: string;
  cauldronResources?: ResolvedSegmentResources;
}

// Camera presets for cinematic AI stories — slow, continuous, dramatic pans
const CAMERA_PRESETS = [
  { scaleStart: 1.0, scaleEnd: 1.15, x: 0, y: -15 }, // Slow zoom in, pan up
  { scaleStart: 1.15, scaleEnd: 1.0, x: -20, y: 0 }, // Slow zoom out, pan right
  { scaleStart: 1.05, scaleEnd: 1.2, x: 15, y: 15 }, // Zoom in, pan down-left
  { scaleStart: 1.2, scaleEnd: 1.05, x: 0, y: 20 },  // Zoom out, pan down
  { scaleStart: 1.0, scaleEnd: 1.1, x: 25, y: 0 },   // Pan left
  { scaleStart: 1.1, scaleEnd: 1.25, x: -15, y: -15 }, // Zoom in, pan up-right
];

export const AIStoryMode: React.FC<AIStoryModeProps> = ({
  segment,
  sceneImages = [],
  scenePhotoUrls = [],
  voiceoverUrl,
  backgroundMusicUrl,
}) => {
  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const scenes = generateSceneData(segment.content, segment.keyTerms, segment.voiceoverTimings);
  
  // Use scenePhotos (stock) if available, otherwise AI generated sceneImages
  const availableVisuals = sceneImages.length > 0 ? sceneImages : scenePhotoUrls;
  const hasVisuals = availableVisuals.length > 0;

  // Title animations
  const introOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const introY = interpolate(frame, [0, 15], [20, 0], { extrapolateRight: "clamp" });

  const timeMs = (frame / fps) * 1000;
  const currentSceneIndex = scenes.findIndex(
    (s) => timeMs >= s.startMs && timeMs < s.endMs
  );
  const currentScene = scenes[currentSceneIndex >= 0 ? currentSceneIndex : scenes.length - 1];

  // Visual background assignment
  let currentVisual = "";
  let transitionProgress = 0;
  let preset = CAMERA_PRESETS[0];

  if (hasVisuals && currentScene) {
    const visualIndex = currentScene.sceneIndex % availableVisuals.length;
    currentVisual = availableVisuals[visualIndex];
    preset = CAMERA_PRESETS[currentScene.sceneIndex % CAMERA_PRESETS.length];
    
    // Linear progress through the scene
    transitionProgress = Math.min(
      Math.max((timeMs - currentScene.startMs) / (currentScene.endMs - currentScene.startMs), 0),
      1
    );
  }

  // Continuous cinematic camera movement
  const cameraScale = interpolate(transitionProgress, [0, 1], [preset.scaleStart, preset.scaleEnd]);
  const cameraX = interpolate(transitionProgress, [0, 1], [0, preset.x]);
  const cameraY = interpolate(transitionProgress, [0, 1], [0, preset.y]);

  // Dark vignette overlay for cinematic feel
  const vignette = "radial-gradient(circle, rgba(0,0,0,0) 40%, rgba(0,0,0,0.8) 100%)";

  return (
    <AbsoluteFill style={{ backgroundColor: "#050505" }}>
      {/* Background audio */}
      {voiceoverUrl && <Audio src={voiceoverUrl} />}
      {backgroundMusicUrl && <Audio src={backgroundMusicUrl} volume={0.15} />}
      {segment.sfxUrl && <Audio src={segment.sfxUrl} volume={0.4} />}

      {/* Cinematic AI Image Background */}
      {currentVisual && (
        <AbsoluteFill style={{ overflow: "hidden" }}>
          <AbsoluteFill
            style={{
              transform: `scale(${cameraScale}) translate(${cameraX}px, ${cameraY}px)`,
              transformOrigin: "center center",
            }}
          >
            <img
              src={currentVisual}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
              alt="AI Story Scene"
            />
          </AbsoluteFill>
          <AbsoluteFill style={{ background: vignette }} />
          <AbsoluteFill style={{ backgroundColor: "rgba(0,0,0,0.3)" }} />
        </AbsoluteFill>
      )}

      {/* Fallback pattern if no visuals */}
      {!hasVisuals && (
        <AbsoluteFill
          style={{
            background: "linear-gradient(135deg, #1f1c2c 0%, #928dab 100%)",
            opacity: 0.8,
          }}
        />
      )}

      {/* Segment Title (Intro) */}
      {frame < fps * 2.5 && (
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            opacity: introOpacity,
            transform: `translateY(${introY}px)`,
            zIndex: 10,
          }}
        >
          <div
            style={{
              fontSize: 64,
              fontWeight: 900,
              color: "white",
              textAlign: "center",
              fontFamily: "'Lora', 'Georgia', serif",
              textShadow: "0px 4px 16px rgba(0,0,0,0.8)",
              background: "rgba(0,0,0,0.4)",
              padding: "20px 40px",
              borderRadius: 20,
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            {segment.title}
          </div>
        </AbsoluteFill>
      )}

      {/* Cinematic Animated Captions */}
      {frame >= fps * 1.5 && <AnimatedCaptions scenes={scenes} style="aistory" />}
    </AbsoluteFill>
  );
};
