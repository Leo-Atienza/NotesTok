"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Trophy, Zap, CheckCircle2, Share2 } from "lucide-react";

interface QuizCompleteProps {
  totalXP: number;
  segmentsCount: number;
  subject: string;
  onReviewAgain: () => void;
}

export function QuizComplete({
  totalXP,
  segmentsCount,
  subject,
  onReviewAgain,
}: QuizCompleteProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `I just earned ${totalXP} XP learning ${subject} on NotesTok! 🚀\n\nNotesTok transforms your notes into interactive micro-lessons. #BuildWithAI`;
    if (navigator.share) {
      navigator.share({ title: "My NotesTok Lesson", text });
    } else {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-6 py-12 max-w-sm mx-auto text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="relative">
        <div className="absolute inset-0 bg-yellow-400/20 rounded-full blur-xl animate-pulse" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center shadow-xl border-4 border-background">
          <Trophy className="w-12 h-12 text-white" />
        </div>
      </div>
      <div>
        <h3 className="text-2xl font-black bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent">
          Lesson Mastered!
        </h3>
        <p className="text-muted-foreground mt-2 text-sm">
          You completed all {segmentsCount} quiz checkpoints.
        </p>
      </div>

      <div className="flex items-center justify-center gap-8 w-full py-6 rounded-2xl bg-muted/50 border">
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-yellow-500 flex items-center gap-1">
            <Zap className="w-5 h-5" fill="currentColor" />
            {totalXP}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            XP Earned
          </span>
        </div>
        <div className="w-px h-12 bg-border" />
        <div className="flex flex-col items-center gap-1">
          <span className="text-2xl font-bold text-primary flex items-center gap-1">
            <CheckCircle2 className="w-5 h-5" />
            {segmentsCount}
          </span>
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
            Segments
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full mt-2">
        <Button
          onClick={handleShare}
          className="w-full gap-2 rounded-xl h-12 text-md font-bold shadow-lg shadow-primary/20"
        >
          {copied ? (
            <><CheckCircle2 className="w-4 h-4" /> Copied!</>
          ) : (
            <><Share2 className="w-4 h-4" /> Share Your Win</>
          )}
        </Button>
        <Button
          variant="outline"
          className="w-full rounded-xl h-12"
          onClick={onReviewAgain}
        >
          Review Quizzes Again
        </Button>
      </div>
    </div>
  );
}
