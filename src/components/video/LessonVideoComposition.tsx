import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainrotMode } from "./BrainrotMode";
import { FireshipMode } from "./FireshipMode";
import type { Segment } from "@/lib/types";

export interface LessonVideoCompositionProps {
  segment: Segment;
  mode: "brainrot" | "fireship";
  sceneImages?: string[];
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  scenePhotoUrls?: string[];
}

export const LessonVideoComposition: React.FC<LessonVideoCompositionProps> = ({
  segment,
  mode,
  sceneImages,
  backgroundVideoUrl,
  backgroundPhotoUrl,
  scenePhotoUrls,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {mode === "brainrot" ? (
        <BrainrotMode
          segment={segment}
          sceneImages={sceneImages}
          backgroundVideoUrl={backgroundVideoUrl}
          backgroundPhotoUrl={backgroundPhotoUrl}
          scenePhotoUrls={scenePhotoUrls}
        />
      ) : (
        <FireshipMode
          segment={segment}
          sceneImages={sceneImages}
          backgroundVideoUrl={backgroundVideoUrl}
          backgroundPhotoUrl={backgroundPhotoUrl}
          scenePhotoUrls={scenePhotoUrls}
        />
      )}
    </AbsoluteFill>
  );
};
