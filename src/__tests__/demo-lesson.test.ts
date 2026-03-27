import { describe, it, expect } from "vitest";
import { DEMO_LESSON, DEMO_LESSON_ID } from "@/lib/demo-lesson";

describe("Demo Lesson — Data Integrity", () => {
  it("has a valid ID", () => {
    expect(DEMO_LESSON_ID).toBe("demo-how-memory-works");
    expect(DEMO_LESSON.id).toBe(DEMO_LESSON_ID);
  });

  it("has required manifest fields", () => {
    expect(DEMO_LESSON.title).toBeTruthy();
    expect(DEMO_LESSON.subject).toBeTruthy();
    expect(["beginner", "intermediate", "advanced"]).toContain(DEMO_LESSON.difficulty);
    expect(DEMO_LESSON.estimatedMinutes).toBeGreaterThan(0);
    expect(DEMO_LESSON.totalXP).toBeGreaterThan(0);
  });

  it("has exactly 4 segments", () => {
    expect(DEMO_LESSON.segments).toHaveLength(4);
  });

  it("all segments have required fields", () => {
    for (const seg of DEMO_LESSON.segments) {
      expect(seg.id).toBeTruthy();
      expect(typeof seg.order).toBe("number");
      expect(["concept", "example", "summary"]).toContain(seg.type);
      expect(seg.title).toBeTruthy();
      expect(seg.content.length).toBeGreaterThan(50);
      expect(seg.keyTerms.length).toBeGreaterThan(0);
      expect(seg.emoji).toBeTruthy();
    }
  });

  it("all segments have quizzes with valid structure", () => {
    for (const seg of DEMO_LESSON.segments) {
      expect(seg.quiz).toBeDefined();
      const quiz = seg.quiz!;
      expect(quiz.question).toBeTruthy();
      expect(quiz.options).toHaveLength(4);
      expect(quiz.correctIndex).toBeGreaterThanOrEqual(0);
      expect(quiz.correctIndex).toBeLessThan(4);
      expect(quiz.explanation).toBeTruthy();
      expect(quiz.hint).toBeTruthy();
      expect(quiz.xpReward).toBeGreaterThan(0);
    }
  });

  it("totalXP matches sum of quiz xpRewards", () => {
    const sum = DEMO_LESSON.segments.reduce(
      (acc, seg) => acc + (seg.quiz?.xpReward || 0),
      0
    );
    expect(DEMO_LESSON.totalXP).toBe(sum);
  });

  it("segment IDs are unique", () => {
    const ids = DEMO_LESSON.segments.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("segments are in correct order", () => {
    for (let i = 0; i < DEMO_LESSON.segments.length; i++) {
      expect(DEMO_LESSON.segments[i].order).toBe(i);
    }
  });

  it("all segments have image prompts for video rendering", () => {
    for (const seg of DEMO_LESSON.segments) {
      expect(seg.imagePrompt).toBeTruthy();
      expect(seg.sceneImagePrompts).toBeDefined();
      expect(seg.sceneImagePrompts!.length).toBeGreaterThanOrEqual(2);
    }
  });

  it("quiz correct answers are plausible (not always same index)", () => {
    const indices = DEMO_LESSON.segments.map((s) => s.quiz!.correctIndex);
    const unique = new Set(indices);
    expect(unique.size).toBeGreaterThan(1);
  });
});
