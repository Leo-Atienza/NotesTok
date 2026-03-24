"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { LessonTabs } from "@/components/lesson/LessonTabs";
import { getLesson } from "@/lib/lesson-store";
import { DEMO_LESSON, DEMO_LESSON_ID } from "@/lib/demo-lesson";
import { Loader2 } from "lucide-react";
import type { LessonManifest } from "@/lib/types";

function LessonContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [manifest, setManifest] = useState<LessonManifest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = searchParams.get("id");
    if (!id) {
      router.push("/");
      return;
    }

    // Demo lesson
    if (id === DEMO_LESSON_ID) {
      setManifest(DEMO_LESSON);
      setLoading(false);
      return;
    }

    // Try lesson store
    const lesson = getLesson(id);
    if (lesson) {
      setManifest(lesson);
      setLoading(false);
      return;
    }

    // Not found — redirect home
    router.push("/");
  }, [searchParams, router]);

  if (loading || !manifest) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <LessonTabs
      manifest={manifest}
      onBack={() => router.push("/")}
    />
  );
}

export default function LessonPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <LessonContent />
    </Suspense>
  );
}
