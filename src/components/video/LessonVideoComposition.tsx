import React from "react";
import { AbsoluteFill } from "remotion";
import { BrainrotMode } from "./BrainrotMode";
import { FireshipMode } from "./FireshipMode";
import type { Segment } from "@/lib/types";

export interface LessonVideoCompositionProps {
  segment: Segment;
  mode: "brainrot" | "fireship";
}

export const LessonVideoComposition: React.FC<LessonVideoCompositionProps> = ({
  segment,
  mode,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: "#000" }}>
      {mode === "brainrot" ? (
        <BrainrotMode segment={segment} />
      ) : (
        <FireshipMode segment={segment} />
      )}
    </AbsoluteFill>
  );
};
