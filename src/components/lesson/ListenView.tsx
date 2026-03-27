"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  Mic,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import type { LessonManifest } from "@/lib/types";
import { updateLessonProgress, recordStudySession } from "@/lib/lesson-store";

interface ListenViewProps {
  manifest: LessonManifest;
  scholarMode?: boolean;
}

export function ListenView({ manifest, scholarMode = false }: ListenViewProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const segments = manifest.segments;
  const seg = segments[currentIdx];
  const hasVoiceover = !!seg.voiceoverUrl;

  // Record study session on mount + track segment views
  useEffect(() => { recordStudySession(); }, []);
  useEffect(() => {
    updateLessonProgress(manifest.id, seg.id);
  }, [currentIdx, manifest.id, seg.id]);

  const stopSpeech = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.removeAttribute("src");
        audioRef.current.load();
        audioRef.current = null;
      }
    };
  }, []);

  // Use scholar content when available and scholar mode is on
  const getContent = useCallback(
    (s: typeof seg) => scholarMode && s.scholarContent ? s.scholarContent : s.content,
    [scholarMode]
  );

  // Use a ref-based approach to avoid circular useCallback dependencies
  const playSegmentRef = useRef<(segIndex: number) => void>(() => {});

  const autoAdvance = useCallback(
    (segIndex: number) => {
      if (segIndex < segments.length - 1) {
        const next = segIndex + 1;
        setCurrentIdx(next);
        setTimeout(() => playSegmentRef.current(next), 500);
      }
    },
    [segments.length]
  );

  const playVoiceover = useCallback(
    (segIndex: number) => {
      const segment = segments[segIndex];
      if (!segment.voiceoverUrl) return;

      stopSpeech();
      setIsPlaying(true);

      const audio = new Audio(segment.voiceoverUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        autoAdvance(segIndex);
      };

      audio.onerror = () => {
        // Fall back to Web Speech
        setIsPlaying(false);
        playSegmentRef.current(segIndex);
      };

      audio.play().catch(() => {
        setIsPlaying(false);
      });
    },
    [segments, stopSpeech, autoAdvance]
  );

  const speakTTS = useCallback(
    (text: string, segIndex: number) => {
      if (typeof window === "undefined" || !window.speechSynthesis) return;

      window.speechSynthesis.cancel();
      setIsPlaying(true);

      const utt = new SpeechSynthesisUtterance(text);
      utt.rate = scholarMode ? 0.85 : 0.95;
      utt.pitch = 1;

      utt.onend = () => {
        setIsPlaying(false);
        autoAdvance(segIndex);
      };

      utt.onerror = () => {
        setIsPlaying(false);
      };

      utteranceRef.current = utt;
      window.speechSynthesis.speak(utt);
    },
    [scholarMode, autoAdvance]
  );

  // Keep the ref updated so auto-advance always uses the latest functions
  playSegmentRef.current = (segIndex: number) => {
    const segment = segments[segIndex];
    if (segment.voiceoverUrl && !scholarMode) {
      playVoiceover(segIndex);
    } else {
      speakTTS(getContent(segment), segIndex);
    }
  };

  const handlePlayPause = () => {
    if (isPlaying) {
      stopSpeech();
    } else {
      playSegmentRef.current(currentIdx);
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
            {hasVoiceover && !scholarMode ? (
              <><Mic className="w-3 h-3" /> AI Voice</>
            ) : (
              <><Volume2 className="w-3 h-3" /> Web Speech</>
            )}
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
        <p className="text-sm leading-relaxed text-muted-foreground">{getContent(seg)}</p>
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
