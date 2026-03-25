import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainrotMode } from "./BrainrotMode";
import { FireshipMode } from "./FireshipMode";
import type { Segment } from "@/lib/types";
import type { ResolvedSegmentResources } from "@/lib/media-types";

export interface LessonVideoCompositionProps {
  segment: Segment;
  mode: "brainrot" | "fireship";
  sceneImages?: string[];
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  scenePhotoUrls?: string[];
  /** Cauldron resources from the Resource Scout */
  cauldronResources?: ResolvedSegmentResources;
}

export const LessonVideoComposition: React.FC<LessonVideoCompositionProps> = ({
  segment,
  mode,
  sceneImages,
  backgroundVideoUrl,
  backgroundPhotoUrl,
  scenePhotoUrls,
  cauldronResources,
}) => {
  const commonProps = {
    segment,
    sceneImages,
    backgroundVideoUrl,
    backgroundPhotoUrl,
    scenePhotoUrls,
    cauldronResources,
  };

  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {mode === "brainrot" ? (
        <BrainrotMode {...commonProps} />
      ) : (
        <FireshipMode {...commonProps} />
      )}
    </AbsoluteFill>
  );
};
