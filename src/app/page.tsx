"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadZone } from "@/components/upload/UploadZone";
import {
  BookOpen,
  Zap,
  Brain,
  Globe,
  Headphones,
  Upload,
  Trophy,
  ArrowRight,
  Sparkles,
  Play,
  Trash2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { LessonManifest } from "@/lib/types";
import { saveLesson, getAllLessons, deleteLesson } from "@/lib/lesson-store";
import { DEMO_LESSON, DEMO_LESSON_ID } from "@/lib/demo-lesson";

export default function Home() {
  const router = useRouter();
  const [lessons, setLessons] = useState<LessonManifest[]>([]);

  // Load saved lessons on mount
  useEffect(() => {
    setLessons(getAllLessons());
  }, []);

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
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Top nav */}
      <div className="max-w-4xl mx-auto px-4 pt-4 flex justify-between items-center">
        <span className="text-sm font-semibold text-muted-foreground">
          NotesTok
        </span>
        <Badge
          variant="outline"
          className="text-[10px] sm:text-xs gap-1 font-normal"
        >
          <Sparkles className="w-3 h-3" />
          Powered by Google Gemini
        </Badge>
      </div>

      {/* Hero — condensed */}
      <div className="max-w-4xl mx-auto px-4 pt-8 sm:pt-12 pb-4 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-2">
          <span className="bg-gradient-to-r from-purple-600 via-primary to-blue-600 bg-clip-text text-transparent">
            NotesTok
          </span>
        </h1>
        <p className="text-lg sm:text-xl font-semibold text-foreground mb-1.5">
          Upload Notes. Get Quizzed. Actually Remember.
        </p>
        <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
          AI transforms study material into TikTok-style video lessons with
          flashcards and quizzes.
        </p>

        {/* How it works — compact horizontal */}
        <div className="flex items-center justify-center gap-2 md:gap-4 mb-6">
          <StepPill icon={<Upload className="w-3.5 h-3.5" />} text="Upload" />
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <StepPill icon={<Brain className="w-3.5 h-3.5" />} text="AI learns" />
          <ArrowRight className="w-3 h-3 text-muted-foreground" />
          <StepPill icon={<Play className="w-3.5 h-3.5" />} text="Watch & Quiz" />
        </div>
      </div>

      {/* Demo button + Upload zone */}
      <div className="max-w-4xl mx-auto px-4 pb-8">
        <div className="flex justify-center mb-4">
          <Button
            onClick={handleDemo}
            variant="outline"
            className="gap-2 border-primary/30 hover:border-primary/60 hover:bg-primary/5"
          >
            <Sparkles className="w-4 h-4 text-primary" />
            Try Demo — How Memory Works
          </Button>
        </div>
        <UploadZone onLessonReady={handleLessonReady} />
      </div>

      {/* Lesson Library */}
      {lessons.length > 0 && (
        <div className="max-w-4xl mx-auto px-4 pb-12">
          <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary" />
            Your Lessons
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {lessons.map((lesson) => (
              <div
                key={lesson.id}
                className="group p-4 rounded-xl border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer relative"
                onClick={() =>
                  router.push(
                    `/lesson?id=${encodeURIComponent(lesson.id)}`
                  )
                }
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-sm truncate">
                      {lesson.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {lesson.subject} &middot;{" "}
                      {lesson.segments.length} segments
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
                  <Badge
                    variant="outline"
                    className="text-[10px] gap-0.5"
                  >
                    <Zap className="w-2.5 h-2.5" />
                    {lesson.totalXP} XP
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Three Personas */}
      <div className="max-w-4xl mx-auto px-4 pb-12">
        <h2 className="text-center text-base font-semibold mb-1">
          Adaptive Delivery for Every Brain
        </h2>
        <p className="text-center text-xs text-muted-foreground mb-6">
          One tool, three modes — built for the way you actually study
        </p>
        <div className="grid md:grid-cols-3 gap-3">
          <PersonaCard
            icon={<Zap className="w-4 h-4" />}
            title="Focus-Seeker"
            subtitle="For the ADHD brain"
            description="30-second micro-segments with quiz gates. Gamified XP keeps motivation high."
            accentColor="border-l-amber-500"
            iconBg="bg-amber-100 text-amber-600"
          />
          <PersonaCard
            icon={<Headphones className="w-4 h-4" />}
            title="Commuter"
            subtitle="Multi-modal learner"
            description="Audio narration with play, pause, skip. Study while walking or on transit."
            accentColor="border-l-blue-500"
            iconBg="bg-blue-100 text-blue-600"
          />
          <PersonaCard
            icon={<Globe className="w-4 h-4" />}
            title="Global Scholar"
            subtitle="ESL student"
            description="One-tap simplification. Exam-critical terms preserved."
            accentColor="border-l-green-500"
            iconBg="bg-green-100 text-green-600"
          />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-3xl mx-auto px-4 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <FeatureCard
            icon={<BookOpen className="w-4 h-4" />}
            title="Upload Anything"
            desc="PDFs, notes, text"
          />
          <FeatureCard
            icon={<Zap className="w-4 h-4" />}
            title="Stop & Solve"
            desc="Quiz gates force recall"
          />
          <FeatureCard
            icon={<Brain className="w-4 h-4" />}
            title="Panic Button"
            desc="Fresh analogy on demand"
          />
          <FeatureCard
            icon={<Globe className="w-4 h-4" />}
            title="Global Scholar"
            desc="Simplified language"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-6 space-y-0.5">
        <p className="text-xs text-muted-foreground">
          Built for Build With AI 2026 — GDG UTSC
        </p>
        <p className="text-xs text-muted-foreground">Powered by Google Gemini</p>
      </div>
    </div>
  );
}

function StepPill({
  icon,
  text,
}: {
  icon: React.ReactNode;
  text: string;
}) {
  return (
    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/60 border text-xs font-medium">
      {icon}
      {text}
    </div>
  );
}

function PersonaCard({
  icon,
  title,
  subtitle,
  description,
  accentColor,
  iconBg,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  iconBg: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border border-l-4 ${accentColor} bg-card hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-2.5 mb-2">
        <div
          className={`w-8 h-8 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-[11px] text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
}) {
  return (
    <div className="p-4 rounded-xl border bg-card text-left hover:border-primary/30 transition-all">
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-2">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-0.5">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
