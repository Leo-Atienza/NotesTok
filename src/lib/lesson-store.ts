import type { LessonManifest } from "./types";

const STORAGE_KEY = "notestok:lessons";
const IMAGES_KEY = "notestok:images";

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
