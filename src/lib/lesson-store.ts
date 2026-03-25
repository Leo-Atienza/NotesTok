import type { LessonManifest, StudyProgress, LessonProgress } from "./types";

const STORAGE_KEY = "notestok:lessons";
const IMAGES_KEY = "notestok:images";
const PROGRESS_KEY = "notestok:progress";

// In-memory store
const lessons = new Map<string, LessonManifest>();
const lessonImages = new Map<string, Record<string, string[]>>();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: LessonManifest[] = JSON.parse(raw);
      for (const l of parsed) {
        lessons.set(l.id, l);
      }
    }
  } catch {
    // corrupted localStorage — ignore
  }

  try {
    const raw = localStorage.getItem(IMAGES_KEY);
    if (raw) {
      const parsed: Record<string, Record<string, string[]>> = JSON.parse(raw);
      for (const [id, imgs] of Object.entries(parsed)) {
        lessonImages.set(id, imgs);
      }
    }
  } catch {
    // ignore
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const all = Array.from(lessons.values());
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    // quota exceeded — ignore
  }
}

function persistImages() {
  if (typeof window === "undefined") return;
  try {
    const all = Object.fromEntries(lessonImages.entries());
    localStorage.setItem(IMAGES_KEY, JSON.stringify(all));
  } catch {
    // quota exceeded — base64 images are large, may fail
  }
}

export function saveLesson(manifest: LessonManifest) {
  hydrate();
  lessons.set(manifest.id, manifest);
  persist();
}

export function getLesson(id: string): LessonManifest | null {
  hydrate();
  return lessons.get(id) ?? null;
}

export function getAllLessons(): LessonManifest[] {
  hydrate();
  return Array.from(lessons.values());
}

export function deleteLesson(id: string) {
  hydrate();
  lessons.delete(id);
  lessonImages.delete(id);
  persist();
  persistImages();
}

export function saveLessonImages(
  lessonId: string,
  images: Record<string, string[]>
) {
  hydrate();
  lessonImages.set(lessonId, images);
  persistImages();
}

export function getLessonImages(
  lessonId: string
): Record<string, string[]> | null {
  hydrate();
  return lessonImages.get(lessonId) ?? null;
}

// === PROGRESS TRACKING ===

function getProgressData(): StudyProgress {
  if (typeof window === "undefined") {
    return { totalXP: 0, lessonsCompleted: 0, studyDays: [], lessonProgress: {} };
  }
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return { totalXP: 0, lessonsCompleted: 0, studyDays: [], lessonProgress: {} };
}

function saveProgressData(data: StudyProgress) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(data));
  } catch { /* ignore */ }
}

export function recordStudySession() {
  const data = getProgressData();
  const today = new Date().toISOString().slice(0, 10);
  if (!data.studyDays.includes(today)) {
    data.studyDays.push(today);
  }
  saveProgressData(data);
}

export function getStreak(): number {
  const data = getProgressData();
  if (data.studyDays.length === 0) return 0;

  const sorted = [...data.studyDays].sort().reverse();
  let streak = 0;
  const today = new Date();

  for (let i = 0; i < sorted.length; i++) {
    const expected = new Date(today);
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);

    if (sorted[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

export function getLessonProgress(lessonId: string): LessonProgress | null {
  const data = getProgressData();
  return data.lessonProgress[lessonId] ?? null;
}

export function updateLessonProgress(
  lessonId: string,
  segmentId?: string,
  quizPassed?: boolean,
  xp?: number
) {
  const data = getProgressData();
  if (!data.lessonProgress[lessonId]) {
    data.lessonProgress[lessonId] = {
      segmentsViewed: [],
      quizzesPassed: [],
      xpEarned: 0,
    };
  }

  const lp = data.lessonProgress[lessonId];

  if (segmentId && !lp.segmentsViewed.includes(segmentId)) {
    lp.segmentsViewed.push(segmentId);
  }

  if (segmentId && quizPassed && !lp.quizzesPassed.includes(segmentId)) {
    lp.quizzesPassed.push(segmentId);
  }

  if (xp) {
    lp.xpEarned += xp;
    data.totalXP += xp;
  }

  saveProgressData(data);
}

export function getTotalStats(): StudyProgress {
  return getProgressData();
}
