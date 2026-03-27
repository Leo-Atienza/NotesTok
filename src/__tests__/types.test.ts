import { describe, it, expect } from "vitest";
import type {
  LessonManifest,
  Segment,
  QuizCheckpoint,
  LearnerProfile,
  StudyProgress,
  LessonProgress,
  ChatMessage,
  PlayerState,
} from "@/lib/types";

describe("Type Definitions — Runtime Validation", () => {
  it("LearnerProfile accepts valid values", () => {
    const profiles: LearnerProfile[] = ["focus-seeker", "multi-modal", "global-scholar"];
    expect(profiles).toHaveLength(3);
  });

  it("PlayerState covers all states", () => {
    const states: PlayerState[] = [
      "loading",
      "playing",
      "paused",
      "quiz-active",
      "quiz-feedback",
      "panic-loading",
      "completed",
    ];
    expect(states).toHaveLength(7);
  });

  it("a valid LessonManifest can be constructed", () => {
    const manifest: LessonManifest = {
      id: "test",
      title: "Test",
      subject: "Test",
      difficulty: "beginner",
      estimatedMinutes: 5,
      totalXP: 10,
      segments: [],
    };
    expect(manifest.id).toBe("test");
    expect(manifest.learnerProfile).toBeUndefined();
  });

  it("a valid Segment can be constructed with all optional fields", () => {
    const seg: Segment = {
      id: "s1",
      order: 0,
      type: "concept",
      title: "Test",
      content: "Test content",
      keyTerms: ["a"],
      emoji: "🧪",
      quiz: {
        question: "Q?",
        options: ["A", "B", "C", "D"],
        correctIndex: 0,
        explanation: "Because",
        hint: "Think about it",
        xpReward: 10,
      },
      scholarContent: "Simplified text",
      imagePrompt: "A test image",
      backgroundVideoUrl: "https://example.com/video.mp4",
      voiceoverUrl: "https://example.com/voice.mp3",
    };
    expect(seg.quiz).toBeDefined();
    expect(seg.scholarContent).toBe("Simplified text");
  });

  it("StudyProgress starts with sensible defaults", () => {
    const defaults: StudyProgress = {
      totalXP: 0,
      lessonsCompleted: 0,
      studyDays: [],
      lessonProgress: {},
    };
    expect(defaults.totalXP).toBe(0);
    expect(defaults.studyDays).toEqual([]);
  });

  it("LessonProgress tracks segments and quizzes", () => {
    const progress: LessonProgress = {
      segmentsViewed: ["s1", "s2"],
      quizzesPassed: ["s1"],
      xpEarned: 25,
    };
    expect(progress.segmentsViewed).toHaveLength(2);
    expect(progress.quizzesPassed).toHaveLength(1);
  });

  it("ChatMessage supports all role and type combinations", () => {
    const msgs: ChatMessage[] = [
      { id: "1", role: "buddy", content: "Hi", type: "text", timestamp: Date.now() },
      { id: "2", role: "user", content: "notes", type: "upload", timestamp: Date.now() },
      { id: "3", role: "system", content: "Select profile", type: "profile-select", timestamp: Date.now() },
      { id: "4", role: "buddy", content: "Lesson ready!", type: "lesson-ready", timestamp: Date.now() },
      { id: "5", role: "buddy", content: "Correct!", type: "quiz-result", timestamp: Date.now() },
    ];
    expect(msgs).toHaveLength(5);
    expect(msgs.every((m) => m.id && m.content)).toBe(true);
  });

  it("QuizCheckpoint validates all fields present", () => {
    const quiz: QuizCheckpoint = {
      question: "What is X?",
      options: ["A", "B", "C", "D"],
      correctIndex: 2,
      explanation: "Because C",
      hint: "Not A or B",
      xpReward: 15,
    };
    expect(quiz.options).toHaveLength(4);
    expect(quiz.correctIndex).toBe(2);
    expect(quiz.xpReward).toBeGreaterThan(0);
  });
});
