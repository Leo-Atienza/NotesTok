"use client";

import { useState } from "react";
import { UploadZone } from "@/components/upload/UploadZone";
import { LessonPlayer } from "@/components/lesson/LessonPlayer";
import { BookOpen, Zap, Brain, Globe } from "lucide-react";
import type { LessonManifest } from "@/lib/types";

export default function Home() {
  const [manifest, setManifest] = useState<LessonManifest | null>(null);

  if (manifest) {
    return (
      <LessonPlayer manifest={manifest} onRestart={() => setManifest(null)} />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/30">
      {/* Hero */}
      <div className="max-w-4xl mx-auto px-4 pt-16 pb-12 text-center">
        <h1 className="text-5xl font-black tracking-tight mb-3">
          <span className="text-primary">NotesTok</span>
        </h1>
        <p className="text-xl text-muted-foreground mb-2">
          Your Notes Become Your Study Companion
        </p>
        <p className="text-sm text-muted-foreground max-w-lg mx-auto mb-10">
          Upload any study material. AI transforms it into interactive
          micro-lessons with quizzes that adapt to how your brain works.
        </p>

        {/* Upload zone */}
        <UploadZone onLessonReady={setManifest} />

        {/* Features */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-3xl mx-auto">
          <FeatureCard
            icon={<BookOpen className="w-5 h-5" />}
            title="Upload Anything"
            desc="PDFs, notes, text — AI handles it all"
          />
          <FeatureCard
            icon={<Zap className="w-5 h-5" />}
            title="Stop & Solve"
            desc="Quizzes every 30s force active recall"
          />
          <FeatureCard
            icon={<Brain className="w-5 h-5" />}
            title="AI Tutor"
            desc="Adapts difficulty to your level"
          />
          <FeatureCard
            icon={<Globe className="w-5 h-5" />}
            title="Global Scholar"
            desc="Simplified language, exam terms intact"
          />
        </div>

        {/* Footer */}
        <p className="text-xs text-muted-foreground mt-16">
          Built for the Adaptive Brain — Powered by Google Gemini
        </p>
      </div>
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
    <div className="p-4 rounded-xl border bg-card text-left">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-3">
        {icon}
      </div>
      <h3 className="font-semibold text-sm mb-1">{title}</h3>
      <p className="text-xs text-muted-foreground">{desc}</p>
    </div>
  );
}
