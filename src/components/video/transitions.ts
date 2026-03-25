import { interpolate } from "remotion";

export type TransitionType = "flash" | "glitch" | "swipe" | "zoom-punch" | "shake" | "crossfade";

const ALL_TRANSITIONS: TransitionType[] = ["flash", "glitch", "swipe", "zoom-punch", "shake", "crossfade"];

/**
 * Pick a transition type for a given scene index.
 * Ensures variety by cycling and avoiding repeats.
 */
export function pickTransition(sceneIndex: number): TransitionType {
  if (sceneIndex === 0) return "crossfade";
  return ALL_TRANSITIONS[(sceneIndex - 1) % ALL_TRANSITIONS.length];
}

/**
 * Get the container transform style for a transition effect.
 * Returns a CSS transform string to apply to the video container.
 */
export function getTransitionTransform(
  type: TransitionType,
  frameSinceSceneStart: number
): React.CSSProperties {
  switch (type) {
    case "zoom-punch":
      return {
        transform: `scale(${interpolate(frameSinceSceneStart, [0, 5], [1.06, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
        })})`,
      };

    case "shake": {
      if (frameSinceSceneStart > 6) return {};
      const intensity = interpolate(frameSinceSceneStart, [0, 6], [8, 0], {
        extrapolateRight: "clamp",
      });
      const shakeX = Math.sin(frameSinceSceneStart * 3) * intensity;
      const shakeY = Math.cos(frameSinceSceneStart * 4) * intensity * 0.7;
      return {
        transform: `translate(${shakeX}px, ${shakeY}px)`,
      };
    }

    case "swipe": {
      const slideX = interpolate(frameSinceSceneStart, [0, 8], [100, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      });
      return {
        transform: `translateX(${slideX}%)`,
      };
    }

    default:
      return {};
  }
}

/**
 * Get the flash overlay opacity for transition effects that use a flash.
 */
export function getFlashOpacity(type: TransitionType, frameSinceSceneStart: number): number {
  if (type === "flash") {
    return interpolate(frameSinceSceneStart, [0, 3], [0.5, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  }
  return 0;
}

/**
 * Get glitch effect slices for the glitch transition.
 * Returns an array of { y, height, offsetX } for horizontal slice displacement.
 */
export function getGlitchSlices(
  type: TransitionType,
  frameSinceSceneStart: number
): Array<{ y: number; height: number; offsetX: number }> | null {
  if (type !== "glitch" || frameSinceSceneStart > 6) return null;

  const intensity = interpolate(frameSinceSceneStart, [0, 6], [1, 0], {
    extrapolateRight: "clamp",
  });

  // Generate 5 horizontal slices with random-ish displacement
  return [0, 1, 2, 3, 4].map((i) => {
    const y = (i * 20) + Math.sin(frameSinceSceneStart + i * 1.5) * 3;
    const height = 18 + Math.cos(i * 2.3) * 4;
    const offsetX = Math.sin(frameSinceSceneStart * 2 + i * 7) * 30 * intensity;
    return { y, height, offsetX };
  });
}
