"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { LessonManifest } from "@/lib/types";

interface ListenViewProps {
  manifest: LessonManifest;
}

export function ListenView({ manifest }: ListenViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const [useTTS, setUseTTS] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const segments = manifest.segments;
  const seg = segments[currentIdx];

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = useCallback(
    (text: string) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      setIsPlaying(true);

      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = 0.95;
      utt.pitch = 1;

      utt.onend = () => {
        setIsPlaying(false);
        // Auto-advance to next segment
        setCurrentIdx((prev) => {
          if (prev < segments.length - 1) {
            const next = prev + 1;
            // Queue next segment after small delay
            setTimeout(() => speak(segments[next].content), 500);
            return next;
          }
          return prev;
        });
      };

      utt.onerror = () => {
        setIsPlaying(false);
      };

      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    },
    [segments]
  );

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      speak(seg.content);
    }
  };

  const handlePrev = () => {
    stopSpeech();
    setCurrentIdx((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    stopSpeech();
    setCurrentIdx((prev) => Math.min(segments.length - 1, prev + 1));
  };

  const overallProgress = ((currentIdx + (isPlaying ? 0.5 : 0)) / segments.length) * 100;

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      {/* Album art style card */}
      <div className="w-full max-w-sm aspect-square rounded-2xl bg-gradient-to-br from-purple-600/20 via-primary/10 to-blue-600/20 border flex flex-col items-center justify-center p-8 text-center">
        <span className="text-6xl mb-4">{seg.emoji}</span>
        <h2 className="text-lg font-bold mb-1">{seg.title}</h2>
        <p className="text-xs text-muted-foreground">
          Segment {currentIdx + 1} of {segments.length}
        </p>
        {seg.keyTerms.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mt-4">
            {seg.keyTerms.map((term) => (
              <span
                key={term}
                className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                {term}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Overall progress */}
      <div className="w-full max-w-sm">
        <Progress value={overallProgress} className="h-1.5" />
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-muted-foreground">
            {currentIdx + 1}/{segments.length}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Volume2 className="w-3 h-3" />
            Web Speech
          </span>
        </div>
      </div>

      {/* Transport controls */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrev}
          disabled={currentIdx === 0}
          className="h-12 w-12"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          size="icon"
          onClick={handlePlayPause}
          disabled={loading}
          className="h-16 w-16 rounded-full"
        >
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-6 h-6" />
          ) : (
            <Play className="w-6 h-6 ml-0.5" />
          )}
        </Button>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleNext}
          disabled={currentIdx === segments.length - 1}
          className="h-12 w-12"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      {/* Current segment text (scrollable) */}
      <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4 max-h-40 overflow-y-auto">
        <p className="text-sm leading-relaxed text-muted-foreground">{seg.content}</p>
      </div>

      {/* Segment list */}
      <div className="w-full max-w-sm space-y-1">
        {segments.map((s, i) => (
          <button
            key={s.id}
            onClick={() => {
              stopSpeech();
              setCurrentIdx(i);
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors text-sm ${
              i === currentIdx
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-muted text-muted-foreground"
            }`}
          >
            <span className="text-base">{s.emoji}</span>
            <span className="truncate flex-1">{s.title}</span>
            {i < currentIdx && (
              <span className="text-xs text-green-500">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
