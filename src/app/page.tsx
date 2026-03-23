"use client";

import { useState } from "react";
import { UploadZone } from "@/components/upload/UploadZone";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { LessonSkeleton } from "@/components/ui/lesson-skeleton";
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { LessonManifest } from "@/lib/types";

export default function Home() {
  const [manifest, setManifest] = useState<LessonManifest | null>(null);
  const [showSkeleton, setShowSkeleton] = useState(false);

  const handleLessonReady = (m: LessonManifest) => {
    setShowSkeleton(true);
    // Brief skeleton before player mounts — feels premium
    setTimeout(() => {
      setShowSkeleton(false);
      setManifest(m);
    }, 600);
  };

  if (showSkeleton) {
    return <LessonSkeleton />;
  }

  if (manifest) {
    return (
      <ErrorBoundary onReset={() => setManifest(null)}>
        <LessonPlayer manifest={manifest} onRestart={() => setManifest(null)} />
      </ErrorBoundary>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Top nav */}
      <div className="max-w-4xl mx-auto px-4 pt-4 flex justify-between items-center">
        <span className="text-sm font-semibold text-muted-foreground">NotesTok</span>
        <Badge variant="outline" className="text-[10px] sm:text-xs gap-1 font-normal">
          <Sparkles className="w-3 h-3" />
          Powered by Google Gemini
        </Badge>
      </div>

      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-10 sm:pt-16 pb-6 sm:pb-8 text-center">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight mb-3">
          <span className="bg-gradient-to-r from-purple-600 via-primary to-blue-600 bg-clip-text text-transparent">
            NotesTok
          </span>
        </h1>
        <p className="text-lg sm:text-xl md:text-2xl font-semibold text-foreground mb-2">
          Upload Notes. Get Quizzed. Actually Remember.
        </p>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-4">
          AI transforms any study material into interactive micro-lessons with
          quizzes that adapt to how your brain works.
        </p>
        <Badge
          variant="secondary"
          className="text-xs font-medium gap-1.5 px-3 py-1"
        >
          <Sparkles className="w-3 h-3" />
          Built on active recall + spaced retrieval research
        </Badge>
      </div>

      {/* How It Works — 3 Steps */}
      <div className="max-w-2xl mx-auto px-4 pb-10">
        <div className="flex items-center justify-center gap-2 md:gap-4">
          <StepCard
            icon={<Upload className="w-5 h-5" />}
            title="Upload any notes"
            color="text-purple-600 bg-purple-100"
          />
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="w-6 border-t border-dashed border-muted-foreground/30 shrink-0 sm:hidden" />
          <StepCard
            icon={<Brain className="w-5 h-5" />}
            title="AI creates micro-lessons"
            color="text-primary bg-primary/10"
          />
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 hidden sm:block" />
          <div className="w-6 border-t border-dashed border-muted-foreground/30 shrink-0 sm:hidden" />
          <StepCard
            icon={<Trophy className="w-5 h-5" />}
            title="Quiz gates force recall"
            color="text-amber-600 bg-amber-100"
          />
        </div>
      </div>

      {/* Upload zone */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <UploadZone onLessonReady={handleLessonReady} />
      </div>

      {/* Three Personas Section */}
      <div className="max-w-4xl mx-auto px-4 pb-16">
        <h2 className="text-center text-lg font-semibold mb-1">
          Adaptive Delivery for Every Brain
        </h2>
        <p className="text-center text-sm text-muted-foreground mb-8">
          One tool, three modes — built for the way you actually study
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <PersonaCard
            icon={<Zap className="w-5 h-5" />}
            title="Focus-Seeker"
            subtitle="For the ADHD brain"
            description="30-second micro-segments with quiz gates every minute. Gamified XP keeps motivation high. Impossible to zone out."
            accentColor="border-l-amber-500"
            iconBg="bg-amber-100 text-amber-600"
          />
          <PersonaCard
            icon={<Headphones className="w-5 h-5" />}
            title="Commuter"
            subtitle="For the multi-modal learner"
            description="Audio narration with play, pause, and skip. Study while walking, riding transit, or waiting in line."
            accentColor="border-l-blue-500"
            iconBg="bg-blue-100 text-blue-600"
          />
          <PersonaCard
            icon={<Globe className="w-5 h-5" />}
            title="Global Scholar"
            subtitle="For the ESL student"
            description="One-tap language simplification. Complex grammar made simple. Exam-critical terms preserved exactly as they appear."
            accentColor="border-l-green-500"
            iconBg="bg-green-100 text-green-600"
          />
        </div>
      </div>

      {/* Features */}
      <div className="max-w-3xl mx-auto px-4 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <FeatureCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Upload Anything"
            desc="PDFs, notes, text — AI handles it all"
            delay={0}
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Stop & Solve"
            desc="Quizzes every 30s force active recall"
            delay={100}
          />
          <FeatureCard
            icon={<Brain className="w-5 h-5" />}
            title="Panic Button"
            desc="AI re-explains with a fresh analogy"
            delay={200}
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5" />}
            title="Global Scholar"
            desc="Simplified language, exam terms intact"
            delay={300}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-8 space-y-1">
        <p className="text-xs text-muted-foreground">
          Built for Build With AI 2026 — GDG UTSC
        </p>
        <p className="text-xs text-muted-foreground">
          Powered by Google Gemini
        </p>
      </div>
    </div>
  );
}

function StepCard({
  icon,
  title,
  color,
}: {
  icon: React.ReactNode;
  title: string;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2 min-w-0">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}
      >
        {icon}
      </div>
      <span className="text-xs font-medium text-center leading-tight">
        {title}
      </span>
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
      className={`p-5 rounded-xl border border-l-4 ${accentColor} bg-card hover:shadow-sm transition-shadow`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className={`w-9 h-9 rounded-lg flex items-center justify-center ${iconBg}`}
        >
          {icon}
        </div>
        <div>
          <h3 className="font-semibold text-sm">{title}</h3>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  delay: number;
}) {
  return (
    <div
      className="p-5 rounded-xl border bg-card text-left hover:border-primary/30 hover:shadow-sm transition-all animate-fade-in"
      style={{ animationDelay: `${delay}ms`, animationFillMode: "both" }}
    >
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
