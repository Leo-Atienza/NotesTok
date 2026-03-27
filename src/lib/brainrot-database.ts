/**
 * A curated database of high-energy, high-retention Brainrot backgrounds.
 * Normally, these would be S3 buckets of Subway Surfers, GTA V ramp jumps, and Minecraft Parkour.
 * For this implementation, we use reliable remote MP4s that emulate the visual stimulation.
 */

export const BRAINROT_DB = [
  // Creative Commons / Royalty Free Satisfying & Gameplay-esque videos
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
];

/**
 * Get a random brainrot video URL for the split-screen background.
 */
export function getRandomBrainrotVideo(): string {
  const index = Math.floor(Math.random() * BRAINROT_DB.length);
  return BRAINROT_DB[index];
}
