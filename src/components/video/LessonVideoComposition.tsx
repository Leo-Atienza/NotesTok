import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainrotMode } from "./BrainrotMode";
import { FireshipMode } from "./FireshipMode";
import type { Segment } from "@/lib/types";

export interface LessonVideoCompositionProps {
  segment: Segment;
  mode: "brainrot" | "fireship";
  sceneImages?: string[];
}

export const LessonVideoComposition: React.FC<LessonVideoCompositionProps> = ({
  segment,
  mode,
  sceneImages,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {mode === "brainrot" ? (
        <BrainrotMode segment={segment} sceneImages={sceneImages} />
      ) : (
        <FireshipMode segment={segment} sceneImages={sceneImages} />
      )}
    </AbsoluteFill>
  );
};
