/**
 * Color themes for the animated brainrot background.
 * Each theme produces a different hypnotic gradient animation.
 */
export const BRAINROT_THEMES = [
  { colors: ["#ff0050", "#7c00ff", "#00f2fe"], name: "neon-rush" },
  { colors: ["#f5af19", "#f12711", "#ff0050"], name: "lava-flow" },
  { colors: ["#00f260", "#0575e6", "#7c00ff"], name: "matrix-rain" },
  { colors: ["#fc466b", "#3f5efb", "#00f2fe"], name: "vapor-wave" },
  { colors: ["#f953c6", "#b91d73", "#7c00ff"], name: "pink-storm" },
  { colors: ["#00c6ff", "#0072ff", "#7c00ff"], name: "deep-ocean" },
];

/**
 * Get a deterministic brainrot theme based on a seed string.
 */
export function getBrainrotTheme(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash += seed.charCodeAt(i);
  return BRAINROT_THEMES[hash % BRAINROT_THEMES.length];
}
