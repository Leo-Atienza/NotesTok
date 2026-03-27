import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainrotMode } from "./BrainrotMode";
import { FireshipMode } from "./FireshipMode";
import { AIStoryMode } from "./AIStoryMode";
import { WhiteboardMode } from "./WhiteboardMode";

import type { Segment } from "@/lib/types";
import type { ResolvedSegmentResources } from "@/lib/media-types";

export interface LessonVideoCompositionProps {
  segment: Segment;
  mode: "brainrot" | "fireship" | "aistory" | "whiteboard";
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
      {mode === "brainrot" && (
        <BrainrotMode {...commonProps} />
      )}
      {mode === "fireship" && (
        <FireshipMode {...commonProps} />
      )}
      {mode === "aistory" && (
        <AIStoryMode {...commonProps} />
      )}
      {mode === "whiteboard" && (
        <WhiteboardMode
          segment={segment}
          sceneImages={sceneImages}
        />
      )}
    </AbsoluteFill>
  );
};
