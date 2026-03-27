// === LEARNER PROFILES ===

export type LearnerProfile = "focus-seeker" | "multi-modal" | "global-scholar";

// === LESSON MANIFEST (Gemini generates this) ===

export interface LessonManifest {
  id: string;
  title: string;
  subject: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedMinutes: number;
  totalXP: number;
  learnerProfile?: LearnerProfile;
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
  voiceoverTimings?: { word: string; startMs: number; endMs: number }[];
  codeSnippet?: { language: string; code: string };
  scoutedMemeUrl?: string;
  sfxUrl?: string;
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

// === BUDDY CHAT ===

export interface ChatMessage {
  id: string;
  role: "buddy" | "user" | "system";
  content: string;
  type: "text" | "upload" | "profile-select" | "lesson-ready" | "quiz-result";
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// === PROGRESSION ===

export interface StudyProgress {
  totalXP: number;
  lessonsCompleted: number;
  studyDays: string[]; // ISO date strings
  lessonProgress: Record<string, LessonProgress>;
}

export interface LessonProgress {
  segmentsViewed: string[];
  quizzesPassed: string[];
  xpEarned: number;
  completedAt?: number;
}
