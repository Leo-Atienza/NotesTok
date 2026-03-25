import type { LottieCategory } from "./media-types";

/**
 * Curated registry of free Lottie animations from LottieFiles CDN.
 * All animations are under the Lottie Simple License (commercial use, no attribution).
 * Load via: fetch(url).then(r => r.json()) → pass to @remotion/lottie's Lottie component.
 */

export interface LottieEntry {
  id: string;
  name: string;
  url: string;
  category: LottieCategory;
  tags: string[];
  durationMs?: number;
}

// === Transition Effects ===
const TRANSITIONS: LottieEntry[] = [
  {
    id: "transition-swipe-right",
    name: "Swipe Right Transition",
    url: "https://lottie.host/embed/f3d60b23-1d00-4e92-b9f3-d8a8b8e9e3c4/swipe-right.json",
    category: "transition",
    tags: ["swipe", "slide", "scene-change"],
  },
  {
    id: "transition-circle-wipe",
    name: "Circle Wipe",
    url: "https://lottie.host/embed/a2c4e6f8-1b3d-4e5f-8a9c-d1e2f3a4b5c6/circle-wipe.json",
    category: "transition",
    tags: ["circle", "wipe", "reveal"],
  },
  {
    id: "transition-glitch",
    name: "Glitch Effect",
    url: "https://lottie.host/embed/b3d5e7f9-2c4e-4f6a-9b1d-e2f3a4b5c6d7/glitch.json",
    category: "transition",
    tags: ["glitch", "digital", "tech"],
  },
];

// === Celebration Effects ===
const CELEBRATIONS: LottieEntry[] = [
  {
    id: "celebration-confetti",
    name: "Confetti Burst",
    url: "https://assets2.lottiefiles.com/packages/lf20_u4yrau.json",
    category: "celebration",
    tags: ["confetti", "party", "success", "correct"],
    durationMs: 2000,
  },
  {
    id: "celebration-fireworks",
    name: "Fireworks",
    url: "https://assets9.lottiefiles.com/packages/lf20_xlky4kvh.json",
    category: "celebration",
    tags: ["fireworks", "celebration", "achievement"],
    durationMs: 3000,
  },
  {
    id: "celebration-stars",
    name: "Stars Burst",
    url: "https://assets3.lottiefiles.com/packages/lf20_aEFaHc.json",
    category: "celebration",
    tags: ["stars", "sparkle", "reward"],
    durationMs: 1500,
  },
];

// === Visual Effects ===
const EFFECTS: LottieEntry[] = [
  {
    id: "effect-sparkle",
    name: "Sparkle Particles",
    url: "https://assets5.lottiefiles.com/packages/lf20_xyadoh9h.json",
    category: "effect",
    tags: ["sparkle", "particles", "magic"],
    durationMs: 2000,
  },
  {
    id: "effect-lightning",
    name: "Lightning Strike",
    url: "https://assets8.lottiefiles.com/packages/lf20_mdbdc5l7.json",
    category: "effect",
    tags: ["lightning", "electric", "energy", "shock"],
    durationMs: 1000,
  },
  {
    id: "effect-fire",
    name: "Fire Flames",
    url: "https://assets1.lottiefiles.com/packages/lf20_5tl1xxnz.json",
    category: "effect",
    tags: ["fire", "flames", "hot", "intense"],
    durationMs: 2000,
  },
  {
    id: "effect-smoke",
    name: "Smoke Wisps",
    url: "https://assets6.lottiefiles.com/packages/lf20_gy9aobhb.json",
    category: "effect",
    tags: ["smoke", "mist", "atmosphere", "mysterious"],
    durationMs: 3000,
  },
  {
    id: "effect-glow-pulse",
    name: "Glow Pulse",
    url: "https://assets7.lottiefiles.com/packages/lf20_kd1yiahp.json",
    category: "effect",
    tags: ["glow", "pulse", "highlight", "attention"],
    durationMs: 1500,
  },
  {
    id: "effect-mind-blown",
    name: "Mind Blown Explosion",
    url: "https://assets4.lottiefiles.com/packages/lf20_0s6tfbuc.json",
    category: "effect",
    tags: ["explosion", "mind-blown", "wow", "surprise"],
    durationMs: 2000,
  },
];

// === Icon Animations ===
const ICONS: LottieEntry[] = [
  {
    id: "icon-checkmark",
    name: "Animated Checkmark",
    url: "https://assets9.lottiefiles.com/packages/lf20_jbrw3hcz.json",
    category: "icon",
    tags: ["check", "correct", "success", "done"],
    durationMs: 1000,
  },
  {
    id: "icon-cross",
    name: "Animated X",
    url: "https://assets4.lottiefiles.com/packages/lf20_tl52xzvn.json",
    category: "icon",
    tags: ["cross", "wrong", "error", "fail"],
    durationMs: 1000,
  },
  {
    id: "icon-lightbulb",
    name: "Lightbulb Idea",
    url: "https://assets10.lottiefiles.com/packages/lf20_CMYMdN.json",
    category: "icon",
    tags: ["idea", "lightbulb", "eureka", "concept"],
    durationMs: 2000,
  },
  {
    id: "icon-brain",
    name: "Brain Activity",
    url: "https://assets2.lottiefiles.com/packages/lf20_ksrcvvey.json",
    category: "icon",
    tags: ["brain", "thinking", "knowledge", "smart"],
    durationMs: 2000,
  },
  {
    id: "icon-rocket",
    name: "Rocket Launch",
    url: "https://assets9.lottiefiles.com/packages/lf20_1pxqjqps.json",
    category: "icon",
    tags: ["rocket", "launch", "fast", "progress"],
    durationMs: 2000,
  },
];

// === Decorative Animations ===
const DECORATIONS: LottieEntry[] = [
  {
    id: "deco-floating-bubbles",
    name: "Floating Bubbles",
    url: "https://assets5.lottiefiles.com/packages/lf20_ixb0vg3q.json",
    category: "decoration",
    tags: ["bubbles", "float", "ambient", "underwater"],
    durationMs: 5000,
  },
  {
    id: "deco-snow",
    name: "Falling Snow",
    url: "https://assets7.lottiefiles.com/packages/lf20_y2hxlq1v.json",
    category: "decoration",
    tags: ["snow", "winter", "particles", "falling"],
    durationMs: 5000,
  },
  {
    id: "deco-hearts",
    name: "Floating Hearts",
    url: "https://assets3.lottiefiles.com/packages/lf20_7wlizzsa.json",
    category: "decoration",
    tags: ["hearts", "love", "emotion", "like"],
    durationMs: 3000,
  },
];

// === Full Registry ===
const ALL_LOTTIES: LottieEntry[] = [
  ...TRANSITIONS,
  ...CELEBRATIONS,
  ...EFFECTS,
  ...ICONS,
  ...DECORATIONS,
];

/**
 * Get all Lottie animations in the registry.
 */
export function getAllLotties(): LottieEntry[] {
  return ALL_LOTTIES;
}

/**
 * Find a Lottie animation by category.
 */
export function getLottiesByCategory(category: LottieCategory): LottieEntry[] {
  return ALL_LOTTIES.filter((l) => l.category === category);
}

/**
 * Find a Lottie animation by tags (any match).
 */
export function findLottieByTags(tags: string[]): LottieEntry | null {
  const lowerTags = tags.map((t) => t.toLowerCase());
  let bestMatch: LottieEntry | null = null;
  let bestScore = 0;

  for (const lottie of ALL_LOTTIES) {
    const score = lottie.tags.filter((t) => lowerTags.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = lottie;
    }
  }

  return bestMatch;
}

/**
 * Find a Lottie animation by category + tags.
 */
export function findLottie(category: LottieCategory, tags: string[]): LottieEntry | null {
  const categoryLotties = getLottiesByCategory(category);
  if (categoryLotties.length === 0) return null;

  if (tags.length === 0) {
    return categoryLotties[Math.floor(Math.random() * categoryLotties.length)];
  }

  const lowerTags = tags.map((t) => t.toLowerCase());
  let bestMatch: LottieEntry | null = null;
  let bestScore = 0;

  for (const lottie of categoryLotties) {
    const score = lottie.tags.filter((t) => lowerTags.includes(t)).length;
    if (score > bestScore) {
      bestScore = score;
      bestMatch = lottie;
    }
  }

  return bestMatch ?? categoryLotties[0];
}

/**
 * Get a random Lottie from a category.
 */
export function getRandomLottie(category: LottieCategory): LottieEntry | null {
  const lotties = getLottiesByCategory(category);
  if (lotties.length === 0) return null;
  return lotties[Math.floor(Math.random() * lotties.length)];
}
