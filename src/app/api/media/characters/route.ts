import { NextResponse } from "next/server";
import { getAI, MODEL, withRetry } from "@/lib/gemini";
import { ingestCharacterAsset, findCharacterAsset } from "@/lib/media-store";
import type { CharacterId, CharacterPose } from "@/lib/media-types";

export const runtime = "nodejs";

const CHARACTER_DESIGNS: Record<CharacterId, string> = {
  "hoodie-student": "A cute minimalist cartoon character with a round bald head, small dot eyes, wearing a dark hoodie and sneakers. Simple clean style like @pastimation.us TikTok animations. Transparent background, full body, facing forward.",
  "glasses-nerd": "A cute minimalist cartoon character with a round head, round glasses, messy hair, wearing a plaid shirt and jeans. Nerdy but lovable. Simple clean style. Transparent background, full body, facing forward.",
  "cat-mascot": "A cute cartoon cat character standing upright on two legs, round fluffy body, big expressive eyes, wearing a tiny graduation cap. Kawaii style. Transparent background, full body, facing forward.",
};

const POSE_PROMPTS: Record<CharacterPose, string> = {
  explaining: "pointing with one hand while explaining, confident posture, slight smile",
  shocked: "eyes wide open, mouth open in surprise, hands up near face, dramatic shock pose",
  pointing: "pointing forward directly at the camera with one hand, other hand on hip",
  celebrating: "arms raised in celebration, big smile, jumping with joy",
  confused: "head tilted, one hand scratching head, puzzled expression with question marks",
  facepalm: "one hand covering face in facepalm gesture, slight embarrassment",
  "thumbs-up": "giving a big thumbs up with one hand, confident smile, approving pose",
  "mic-drop": "dropping an invisible microphone, cool confident expression, swagger pose",
};

const ALL_CHARACTERS: CharacterId[] = ["hoodie-student", "glasses-nerd", "cat-mascot"];
const ALL_POSES: CharacterPose[] = ["explaining", "shocked", "pointing", "celebrating", "confused", "facepalm", "thumbs-up", "mic-drop"];

/**
 * POST /api/media/characters
 *
 * Generate character assets for a specific character + pose,
 * or batch-generate all missing characters.
 *
 * Body: { characterId?: CharacterId, pose?: CharacterPose, batchAll?: boolean }
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { characterId, pose, batchAll } = body as {
      characterId?: CharacterId;
      pose?: CharacterPose;
      batchAll?: boolean;
    };

    if (batchAll) {
      // Generate all missing character assets
      const results: Array<{ characterId: string; pose: string; status: string }> = [];

      for (const cId of ALL_CHARACTERS) {
        for (const p of ALL_POSES) {
          // Check if already exists
          const existing = await findCharacterAsset(cId, p);
          if (existing) {
            results.push({ characterId: cId, pose: p, status: "exists" });
            continue;
          }

          try {
            const imageUrl = await generateCharacterImage(cId, p);
            if (imageUrl) {
              await ingestCharacterAsset(cId, p, imageUrl);
              results.push({ characterId: cId, pose: p, status: "generated" });
            } else {
              results.push({ characterId: cId, pose: p, status: "failed" });
            }
          } catch {
            results.push({ characterId: cId, pose: p, status: "error" });
          }

          // Small delay to avoid rate limits
          await new Promise((r) => setTimeout(r, 2000));
        }
      }

      return NextResponse.json({ results });
    }

    // Single character generation
    if (!characterId || !pose) {
      return NextResponse.json(
        { error: "characterId and pose are required" },
        { status: 400 }
      );
    }

    // Check cache first
    const existing = await findCharacterAsset(characterId, pose);
    if (existing) {
      return NextResponse.json({ imageUrl: existing.storageUrl, cached: true });
    }

    const imageUrl = await generateCharacterImage(characterId, pose);
    if (!imageUrl) {
      return NextResponse.json({ error: "Failed to generate image" }, { status: 500 });
    }

    await ingestCharacterAsset(characterId, pose, imageUrl);
    return NextResponse.json({ imageUrl, cached: false });
  } catch (error) {
    console.error("[characters] Error:", error);
    const message = error instanceof Error ? error.message : "Character generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function generateCharacterImage(
  characterId: CharacterId,
  pose: CharacterPose
): Promise<string | null> {
  const ai = getAI();
  const characterDesc = CHARACTER_DESIGNS[characterId];
  const poseDesc = POSE_PROMPTS[pose];

  const prompt = `Generate a cartoon character illustration: ${characterDesc} The character is ${poseDesc}. Clean vector style, bright colors, transparent or solid white background. No text.`;

  try {
    const result = await withRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseModalities: ["image", "text"],
        },
      });
    });

    // Extract base64 image from response
    if (result.candidates?.[0]?.content?.parts) {
      for (const part of result.candidates[0].content.parts) {
        if (part.inlineData?.mimeType?.startsWith("image/")) {
          return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
        }
      }
    }

    return null;
  } catch (error) {
    console.error(`[characters] Failed to generate ${characterId}/${pose}:`, error);
    return null;
  }
}
