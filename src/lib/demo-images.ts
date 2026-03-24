// Pre-baked demo images — SVG data URLs for instant loading.
// Dramatic cinematic gradients that work as video backgrounds.
// Generated lazily to avoid SSR issues.

function makeSvgDataUrl(
  colors: [string, string, string],
  accentColor: string
): string {
  const svg = [
    '<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">',
    "<defs>",
    '<radialGradient id="g" cx="50%" cy="40%" r="80%">',
    `<stop offset="0%" stop-color="${colors[0]}"/>`,
    `<stop offset="50%" stop-color="${colors[1]}"/>`,
    `<stop offset="100%" stop-color="${colors[2]}"/>`,
    "</radialGradient>",
    "</defs>",
    '<rect width="1080" height="1920" fill="url(#g)"/>',
    `<circle cx="540" cy="700" r="250" fill="${accentColor}" opacity="0.08"/>`,
    `<circle cx="300" cy="1200" r="180" fill="${accentColor}" opacity="0.05"/>`,
    `<circle cx="800" cy="400" r="150" fill="${accentColor}" opacity="0.06"/>`,
    "</svg>",
  ].join("");

  if (typeof Buffer !== "undefined") {
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
  }
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

let _cached: Record<string, string[]> | null = null;

function buildImages(): Record<string, string[]> {
  return {
    "seg-sensory": [
      makeSvgDataUrl(["#1a0533", "#3b0764", "#6d28d9"], "#a78bfa"),
      makeSvgDataUrl(["#0c1445", "#1e3a5f", "#7c3aed"], "#818cf8"),
      makeSvgDataUrl(["#1e1b4b", "#312e81", "#4f46e5"], "#6366f1"),
    ],
    "seg-short-term": [
      makeSvgDataUrl(["#042f2e", "#065f46", "#10b981"], "#34d399"),
      makeSvgDataUrl(["#052e16", "#166534", "#22c55e"], "#4ade80"),
      makeSvgDataUrl(["#14532d", "#15803d", "#4ade80"], "#86efac"),
      makeSvgDataUrl(["#022c22", "#064e3b", "#34d399"], "#6ee7b7"),
    ],
    "seg-long-term": [
      makeSvgDataUrl(["#431407", "#7c2d12", "#ea580c"], "#fb923c"),
      makeSvgDataUrl(["#451a03", "#92400e", "#f59e0b"], "#fbbf24"),
      makeSvgDataUrl(["#3b0764", "#6b21a8", "#a855f7"], "#c4b5fd"),
    ],
    "seg-retrieval": [
      makeSvgDataUrl(["#0c4a6e", "#075985", "#0ea5e9"], "#38bdf8"),
      makeSvgDataUrl(["#7f1d1d", "#991b1b", "#ef4444"], "#fca5a5"),
      makeSvgDataUrl(["#1e3a5f", "#1d4ed8", "#3b82f6"], "#93c5fd"),
    ],
  };
}

export function getDemoImages(): Record<string, string[]> {
  if (!_cached) {
    _cached = buildImages();
  }
  return _cached;
}

// Static export for non-SSR contexts
export const DEMO_IMAGES: Record<string, string[]> =
  typeof window !== "undefined" ? buildImages() : {};
