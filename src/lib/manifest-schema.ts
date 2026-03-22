import type { Type } from "@google/genai";

export const contentAnalysisSchema = {
  type: "object" as Type,
  properties: {
    subject: { type: "string" as Type, description: "The overall subject area" },
    difficulty: {
      type: "string" as Type,
      enum: ["beginner", "intermediate", "advanced"],
    },
    prerequisites: {
      type: "array" as Type,
      items: { type: "string" as Type },
      description: "Prerequisite knowledge assumed by the notes",
    },
    concepts: {
      type: "array" as Type,
      items: {
        type: "object" as Type,
        properties: {
          name: { type: "string" as Type },
          description: { type: "string" as Type },
          importance: {
            type: "string" as Type,
            enum: ["critical", "important", "supplementary"],
          },
          relatedTerms: {
            type: "array" as Type,
            items: { type: "string" as Type },
          },
        },
        required: ["name", "description", "importance", "relatedTerms"],
      },
    },
  },
  required: ["subject", "difficulty", "prerequisites", "concepts"],
};

export const lessonManifestSchema = {
  type: "object" as Type,
  properties: {
    id: { type: "string" as Type, description: "Kebab-case lesson ID" },
    title: { type: "string" as Type },
    subject: { type: "string" as Type },
    difficulty: {
      type: "string" as Type,
      enum: ["beginner", "intermediate", "advanced"],
    },
    estimatedMinutes: { type: "number" as Type },
    totalXP: { type: "number" as Type },
    segments: {
      type: "array" as Type,
      items: {
        type: "object" as Type,
        properties: {
          id: { type: "string" as Type },
          order: { type: "number" as Type },
          type: {
            type: "string" as Type,
            enum: ["concept", "example", "summary"],
          },
          title: { type: "string" as Type },
          content: {
            type: "string" as Type,
            description: "Narration text, 75-150 words",
          },
          keyTerms: {
            type: "array" as Type,
            items: { type: "string" as Type },
          },
          emoji: { type: "string" as Type },
          quiz: {
            type: "object" as Type,
            properties: {
              question: { type: "string" as Type },
              options: {
                type: "array" as Type,
                items: { type: "string" as Type },
              },
              correctIndex: { type: "number" as Type },
              explanation: { type: "string" as Type },
              hint: { type: "string" as Type },
              xpReward: { type: "number" as Type },
            },
            required: [
              "question",
              "options",
              "correctIndex",
              "explanation",
              "hint",
              "xpReward",
            ],
          },
        },
        required: [
          "id",
          "order",
          "type",
          "title",
          "content",
          "keyTerms",
          "emoji",
        ],
      },
    },
  },
  required: [
    "id",
    "title",
    "subject",
    "difficulty",
    "estimatedMinutes",
    "totalXP",
    "segments",
  ],
};
