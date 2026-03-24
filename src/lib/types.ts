// === LESSON MANIFEST (Gemini generates this) ===

export interface LessonManifest {
  id: string;
  title: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  totalXP: number;
  segments: Segment[];
  backgroundMusicUrl?: string;
  transitionSfxUrl?: string;
}

export interface Segment {
  id: string;
  order: number;
  type: "concept" | "example" | "summary";
  title: string;
  content: string;
  keyTerms: string[];
  emoji: string;
  quiz?: QuizCheckpoint;
  scholarContent?: string;
  imagePrompt?: string;
  imageUrl?: string;
  sceneImagePrompts?: string[];
  sceneImageUrls?: string[];
  backgroundVideoUrl?: string;
  backgroundPhotoUrl?: string;
  scenePhotoUrls?: string[];
  voiceoverUrl?: string;
}

export interface QuizCheckpoint {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  hint: string;
  xpReward: number;
}

// === CONTENT ANALYSIS (intermediate step) ===

export interface ContentAnalysis {
  concepts: ExtractedConcept[];
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  prerequisites: string[];
}

export interface ExtractedConcept {
  name: string;
  description: string;
  importance: "critical" | "important" | "supplementary";
  relatedTerms: string[];
}

// === LESSON PLAYER STATE ===

export type PlayerState =
  | "loading"
  | "playing"
  | "paused"
  | "quiz-active"
  | "quiz-feedback"
  | "panic-loading"
  | "completed";
