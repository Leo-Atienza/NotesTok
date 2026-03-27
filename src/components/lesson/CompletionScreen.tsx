"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Trophy,
  CheckCircle2,
  Zap,
  Clock,
  Home,
  Share2,
} from "lucide-react";

interface CompletionScreenProps {
  title: string;
  totalSegments: number;
  xp: number;
  estimatedMinutes: number;
  usedScholarMode: boolean;
  usedPanicButton: boolean;
  onExit: () => void;
}

export function CompletionScreen({
  title,
  totalSegments,
  xp,
  estimatedMinutes,
  usedScholarMode,
  usedPanicButton,
  onExit,
}: CompletionScreenProps) {
  const [copied, setCopied] = useState(false);

  const personaCallout = usedScholarMode
    ? "Global Scholar mode simplified content for your learning style"
    : usedPanicButton
      ? "The AI adapted explanations to match your understanding"
      : "Your brain just leveled up through active recall";

  const handleShare = () => {
    const text = `I just completed "${title}" on NotesTok and earned ${xp} XP across ${totalSegments} segments! Built with AI-powered active recall.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-8 max-w-md animate-fade-in">
        {/* Trophy */}
        <div className="w-20 h-20 mx-auto bg-yellow-400/20 rounded-full flex items-center justify-center animate-celebrate animate-pulse-glow">
          <Trophy className="w-10 h-10 text-yellow-500" />
        </div>

        <h2 className="text-3xl font-bold">Lesson Complete!</h2>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-card border text-center">
            <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <p className="text-lg font-bold">{totalSegments}</p>
            <p className="text-xs text-muted-foreground">Segments</p>
          </div>
          <div className="p-3 rounded-xl bg-card border text-center">
            <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
            <p className="text-lg font-bold">{xp}</p>
            <p className="text-xs text-muted-foreground">XP Earned</p>
          </div>
          <div className="p-3 rounded-xl bg-card border text-center">
            <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
            <p className="text-lg font-bold">~{estimatedMinutes}</p>
            <p className="text-xs text-muted-foreground">Minutes</p>
          </div>
        </div>

        {/* Persona callout */}
        <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-sm text-muted-foreground">{personaCallout}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={onExit}>
            <Home className="w-4 h-4 mr-2" />
            New Lesson
          </Button>
          <Button onClick={handleShare}>
            {copied ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4 mr-2" />
                Share Results
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
