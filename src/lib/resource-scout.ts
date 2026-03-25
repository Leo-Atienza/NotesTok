import { getAI, MODEL, withRetry } from "./gemini";
import { RESOURCE_SCOUT_PROMPT } from "./prompts";
import { findLottie } from "./lottie-registry";
import { findOrFetchMedia, findOrFetchGifs, findCharacterAsset } from "./media-store";
import type {
  SceneResourcePlan,
  ResourcePlan,
  ResolvedSceneResources,
  ResolvedSegmentResources,
  CharacterId,
  CharacterPose,
  GifEmotion,
  LottieCategory,
} from "./media-types";
import type { Segment } from "./types";

/**
 * Step 1: Ask Gemini to plan what visual assets each scene needs.
 * Returns a per-scene resource plan with queries, emotions, poses, etc.
 */
export async function planSceneResources(
  segment: Segment,
  subject: string
): Promise<ResourcePlan> {
  const ai = getAI();

  const prompt = RESOURCE_SCOUT_PROMPT
    .replace("{content}", segment.content)
    .replace("{title}", segment.title)
    .replace("{keyTerms}", segment.keyTerms.join(", "))
    .replace("{subject}", subject);

  const result = await withRetry(async () => {
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: sceneResourcePlanSchema,
      },
    });
    return response;
  });

  const text = result.text ?? "[]";
  let scenes: SceneResourcePlan[];

  try {
    const parsed = JSON.parse(text);
    scenes = Array.isArray(parsed) ? parsed : (parsed.scenes ?? []);
  } catch {
    // Fallback: generate basic plans from sentences
    scenes = generateFallbackPlan(segment);
  }

  // Ensure scene indices are correct
  scenes = scenes.map((scene, i) => ({ ...scene, sceneIndex: i }));

  return {
    segmentId: segment.id,
    scenes,
  };
}

/**
 * Step 2: Resolve each scene's plan into actual asset URLs.
 * Queries the Cauldron DB first, then falls back to APIs.
 */
export async function resolveSceneResources(
  plan: ResourcePlan,
  subject: string,
  characterId: CharacterId = "hoodie-student"
): Promise<ResolvedSegmentResources> {
  const resolvedScenes: ResolvedSceneResources[] = [];

  for (const scene of plan.scenes) {
    const resolved: ResolvedSceneResources = {
      sceneIndex: scene.sceneIndex,
      memeText: scene.memeText,
      povText: scene.povText,
    };

    // Resolve background (video/photo)
    try {
      const bgResults = await findOrFetchMedia(
        [scene.backgroundQuery],
        scene.backgroundQuery,
        "concept",
        subject,
        "photo"
      );
      if (bgResults.length > 0) {
        resolved.backgroundUrl = bgResults[0].url;
        resolved.backgroundType = bgResults[0].type;
      }
    } catch { /* skip */ }

    // Resolve reaction GIF
    if (scene.overlayGif) {
      try {
        const gifResults = await findOrFetchGifs(
          scene.overlayGif.query,
          scene.overlayGif.emotion,
          [subject],
          1
        );
        if (gifResults.length > 0) {
          resolved.gifUrl = gifResults[0].url;
          resolved.gifPosition = scene.overlayGif.position;
        }
      } catch { /* skip */ }
    }

    // Resolve Lottie effect
    if (scene.lottieEffect) {
      const lottie = findLottie(
        scene.lottieEffect.category as LottieCategory,
        [scene.backgroundQuery]
      );
      if (lottie) {
        resolved.lottieUrl = lottie.url;
      }
    }

    // Resolve character pose
    if (scene.characterPose) {
      try {
        const character = await findCharacterAsset(
          characterId,
          scene.characterPose as CharacterPose
        );
        if (character) {
          resolved.characterImageUrl = character.storageUrl;
        }
      } catch { /* skip */ }
    }

    // Resolve sticker emojis — use OpenMoji CDN
    if (scene.stickerEmojis && scene.stickerEmojis.length > 0) {
      resolved.stickerUrls = scene.stickerEmojis.map((emoji) => {
        const codePoint = emoji.codePointAt(0)?.toString(16).toUpperCase();
        return codePoint
          ? `https://openmoji.org/data/color/svg/${codePoint}.svg`
          : "";
      }).filter(Boolean);
    }

    resolvedScenes.push(resolved);
  }

  return {
    segmentId: plan.segmentId,
    scenes: resolvedScenes,
  };
}

/**
 * Full pipeline: plan + resolve in one call.
 */
export async function scoutResources(
  segment: Segment,
  subject: string,
  characterId: CharacterId = "hoodie-student"
): Promise<ResolvedSegmentResources> {
  const plan = await planSceneResources(segment, subject);
  return resolveSceneResources(plan, subject, characterId);
}

// === Fallback ===

function generateFallbackPlan(segment: Segment): SceneResourcePlan[] {
  const sentences = segment.content
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 10);

  return sentences.map((sentence, i) => ({
    sceneIndex: i,
    sentence,
    backgroundQuery: `${segment.title} ${segment.keyTerms[0] ?? ""} cinematic`,
    characterPose: (i === 0 ? "explaining" : i === sentences.length - 1 ? "thumbs-up" : "pointing") as CharacterPose,
    stickerEmojis: [segment.emoji],
    ...(i === 0 ? { povText: `POV: you finally understand ${segment.title}` } : {}),
  }));
}

// === Gemini Schema for Structured Output ===

import type { Type } from "@google/genai";

const sceneResourcePlanSchema = {
  type: "array" as Type,
  items: {
    type: "object" as Type,
    properties: {
      sceneIndex: { type: "number" as Type },
      sentence: { type: "string" as Type },
      backgroundQuery: { type: "string" as Type },
      overlayGif: {
        type: "object" as Type,
        properties: {
          query: { type: "string" as Type },
          emotion: {
            type: "string" as Type,
            enum: ["funny", "shocked", "excited", "confused", "mind-blown", "sad", "celebrating", "facepalm"],
          },
          position: {
            type: "string" as Type,
            enum: ["top-left", "top-right", "bottom-left", "bottom-right", "center"],
          },
        },
        required: ["query", "emotion", "position"],
      },
      lottieEffect: {
        type: "object" as Type,
        properties: {
          category: {
            type: "string" as Type,
            enum: ["transition", "effect", "icon", "decoration", "celebration"],
          },
          trigger: {
            type: "string" as Type,
            enum: ["scene-enter", "scene-exit", "keyword"],
          },
        },
        required: ["category", "trigger"],
      },
      characterPose: {
        type: "string" as Type,
        enum: ["explaining", "shocked", "pointing", "celebrating", "confused", "facepalm", "thumbs-up", "mic-drop"],
      },
      stickerEmojis: {
        type: "array" as Type,
        items: { type: "string" as Type },
      },
      memeText: {
        type: "object" as Type,
        properties: {
          top: { type: "string" as Type },
          bottom: { type: "string" as Type },
        },
      },
      povText: { type: "string" as Type },
      humorNote: { type: "string" as Type },
    },
    required: ["sceneIndex", "sentence", "backgroundQuery"],
  },
};
