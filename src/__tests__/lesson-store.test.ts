import { describe, it, expect, beforeEach, vi } from "vitest";

// We need to re-import fresh for each test since the module has internal state
let lessonStore: typeof import("@/lib/lesson-store");

beforeEach(async () => {
  // Reset module cache so hydrated = false
  vi.resetModules();
  lessonStore = await import("@/lib/lesson-store");
});

const makeMockManifest = (id = "test-1") => ({
  id,
  title: "Test Lesson",
  subject: "Testing",
  difficulty: "beginner" as const,
  estimatedMinutes: 5,
  totalXP: 50,
  segments: [
    {
      id: "seg-1",
      order: 0,
      type: "concept" as const,
      title: "Test Segment",
      content: "Test content",
      keyTerms: ["test"],
      emoji: "🧪",
    },
  ],
});

describe("Lesson Store — CRUD Operations", () => {
  it("saves and retrieves a lesson", () => {
    const manifest = makeMockManifest();
    lessonStore.saveLesson(manifest);
    const retrieved = lessonStore.getLesson("test-1");
    expect(retrieved).toEqual(manifest);
  });

  it("returns null for non-existent lesson", () => {
    expect(lessonStore.getLesson("nonexistent")).toBeNull();
  });

  it("getAllLessons returns all saved lessons", () => {
    lessonStore.saveLesson(makeMockManifest("a"));
    lessonStore.saveLesson(makeMockManifest("b"));
    const all = lessonStore.getAllLessons();
    expect(all).toHaveLength(2);
    expect(all.map((l) => l.id)).toContain("a");
    expect(all.map((l) => l.id)).toContain("b");
  });

  it("deleteLesson removes a lesson", () => {
    lessonStore.saveLesson(makeMockManifest("del-me"));
    expect(lessonStore.getLesson("del-me")).not.toBeNull();
    lessonStore.deleteLesson("del-me");
    expect(lessonStore.getLesson("del-me")).toBeNull();
  });

  it("overwrites lesson with same ID", () => {
    const v1 = makeMockManifest("dup");
    lessonStore.saveLesson(v1);
    const v2 = { ...v1, title: "Updated" };
    lessonStore.saveLesson(v2);
    expect(lessonStore.getLesson("dup")?.title).toBe("Updated");
    expect(lessonStore.getAllLessons()).toHaveLength(1);
  });

  it("persists to localStorage on save", () => {
    lessonStore.saveLesson(makeMockManifest());
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});

describe("Lesson Store — Image Storage", () => {
  it("saves and retrieves lesson images", () => {
    const images = { "seg-1": ["data:image/png;base64,abc"] };
    lessonStore.saveLessonImages("test-1", images);
    expect(lessonStore.getLessonImages("test-1")).toEqual(images);
  });

  it("returns null for non-existent images", () => {
    expect(lessonStore.getLessonImages("nope")).toBeNull();
  });
});

describe("Lesson Store — Progress Tracking", () => {
  it("recordStudySession adds today's date", () => {
    lessonStore.recordStudySession();
    const stats = lessonStore.getTotalStats();
    const today = new Date().toISOString().slice(0, 10);
    expect(stats.studyDays).toContain(today);
  });

  it("recordStudySession does not duplicate same day", () => {
    lessonStore.recordStudySession();
    lessonStore.recordStudySession();
    const stats = lessonStore.getTotalStats();
    const today = new Date().toISOString().slice(0, 10);
    expect(stats.studyDays.filter((d) => d === today)).toHaveLength(1);
  });

  it("updateLessonProgress creates progress entry for new lesson", () => {
    lessonStore.updateLessonProgress("lesson-1", "seg-1");
    const progress = lessonStore.getLessonProgress("lesson-1");
    expect(progress).not.toBeNull();
    expect(progress!.segmentsViewed).toContain("seg-1");
  });

  it("updateLessonProgress tracks quiz passes", () => {
    lessonStore.updateLessonProgress("lesson-1", "seg-1", true, 10);
    const progress = lessonStore.getLessonProgress("lesson-1");
    expect(progress!.quizzesPassed).toContain("seg-1");
    expect(progress!.xpEarned).toBe(10);
  });

  it("updateLessonProgress accumulates XP across segments", () => {
    lessonStore.updateLessonProgress("lesson-1", "seg-1", true, 10);
    lessonStore.updateLessonProgress("lesson-1", "seg-2", true, 15);
    const progress = lessonStore.getLessonProgress("lesson-1");
    expect(progress!.xpEarned).toBe(25);
  });

  it("updateLessonProgress does not duplicate segments", () => {
    lessonStore.updateLessonProgress("lesson-1", "seg-1");
    lessonStore.updateLessonProgress("lesson-1", "seg-1");
    const progress = lessonStore.getLessonProgress("lesson-1");
    expect(progress!.segmentsViewed.filter((s) => s === "seg-1")).toHaveLength(1);
  });

  it("updateLessonProgress adds to totalXP in global stats", () => {
    lessonStore.updateLessonProgress("lesson-1", "seg-1", true, 20);
    const stats = lessonStore.getTotalStats();
    expect(stats.totalXP).toBe(20);
  });

  it("getLessonProgress returns null for unknown lesson", () => {
    expect(lessonStore.getLessonProgress("unknown")).toBeNull();
  });
});

describe("Lesson Store — Streak Calculation", () => {
  it("returns 0 when no study days", () => {
    expect(lessonStore.getStreak()).toBe(0);
  });

  it("returns 1 when only today is recorded", () => {
    lessonStore.recordStudySession();
    expect(lessonStore.getStreak()).toBe(1);
  });
});

describe("Lesson Store — getTotalStats", () => {
  it("returns defaults when no data exists", () => {
    const stats = lessonStore.getTotalStats();
    expect(stats.totalXP).toBe(0);
    expect(stats.lessonsCompleted).toBe(0);
    expect(stats.studyDays).toEqual([]);
    expect(stats.lessonProgress).toEqual({});
  });
});
