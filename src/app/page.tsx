"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BuddyChat } from "@/components/buddy/BuddyChat";
import {
  BookOpen,
  Sparkles,
  Trash2,
  Zap,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LessonManifest } from "@/lib/types";
import { saveLesson, getAllLessons, deleteLesson } from "@/lib/lesson-store";
import { DEMO_LESSON, DEMO_LESSON_ID } from "@/lib/demo-lesson";

const BUDDY_NAME_KEY = "notestok:buddy-name";

export default function Home() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonManifest[]>([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const [buddyName, setBuddyName] = useState("Toki");

  useEffect(() => {
    setLessons(getAllLessons());
    const saved = localStorage.getItem(BUDDY_NAME_KEY);
    if (saved) setBuddyName(saved);
  }, []);

  const handleBuddyNameChange = (name: string) => {
    setBuddyName(name);
    localStorage.setItem(BUDDY_NAME_KEY, name);
  };

  const handleLessonReady = (m: LessonManifest) => {
    saveLesson(m);
    router.push(`/lesson?id=${encodeURIComponent(m.id)}`);
  };

  const handleDemo = () => {
    saveLesson(DEMO_LESSON);
    router.push(`/lesson?id=${encodeURIComponent(DEMO_LESSON_ID)}`);
  };

  const handleDeleteLesson = (id: string) => {
    deleteLesson(id);
    setLessons(getAllLessons());
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Minimal header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b bg-background/80 backdrop-blur-lg z-10">
        <span className="text-sm font-black tracking-tight bg-gradient-to-r from-purple-600 via-primary to-blue-600 bg-clip-text text-transparent">
          NotesTok
        </span>
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className="text-[10px] gap-1 font-normal hidden sm:flex"
          >
            <Sparkles className="w-3 h-3" />
            Powered by Gemini
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDemo}
            className="text-xs gap-1 h-7"
          >
            <Sparkles className="w-3 h-3" />
            Demo
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setLessons(getAllLessons());
              setShowLibrary(true);
            }}
            className="text-xs gap-1 h-7"
          >
            <BookOpen className="w-3 h-3" />
            Lessons{lessons.length > 0 && ` (${lessons.length})`}
          </Button>
        </div>
      </div>

      {/* Chat fills remaining space */}
      <div className="flex-1 min-h-0">
        <BuddyChat
          onLessonReady={handleLessonReady}
          buddyName={buddyName}
          onBuddyNameChange={handleBuddyNameChange}
        />
      </div>

      {/* Lesson library drawer */}
      {showLibrary && (
        <div className="fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowLibrary(false)}
          />
          <div className="relative ml-auto w-full max-w-sm bg-background h-full border-l shadow-xl overflow-y-auto animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-background z-10">
              <h2 className="text-sm font-semibold flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" />
                Your Lessons
              </h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => setShowLibrary(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 space-y-2">
              {lessons.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No lessons yet. Chat with {buddyName} to create one!
                </p>
              )}
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="group p-3 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => {
                    setShowLibrary(false);
                    router.push(`/lesson?id=${encodeURIComponent(lesson.id)}`);
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-sm truncate">
                        {lesson.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {lesson.subject} &middot; {lesson.segments.length} segments
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteLesson(lesson.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <Badge variant="secondary" className="text-[10px]">
                      {lesson.difficulty}
                    </Badge>
                    <Badge variant="outline" className="text-[10px] gap-0.5">
                      <Zap className="w-2.5 h-2.5" />
                      {lesson.totalXP} XP
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
