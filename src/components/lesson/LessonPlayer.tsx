"use client";

import { useEffect, useRef, useState } from "react";
import { useLessonPlayer } from "@/hooks/useLessonPlayer";
import { StopAndSolve } from "@/components/quiz/StopAndSolve";
import { XPCounter } from "@/components/gamification/XPCounter";
import { XPPopup } from "@/components/gamification/XPPopup";
import { GlobalScholarToggle } from "@/components/scholar/GlobalScholarToggle";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Lightbulb,
  Loader2,
  Trophy,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Share2,
  CheckCircle2,
  Zap,
  Clock,
  SkipForward,
  Home,
} from "lucide-react";
import { speak, cancelSpeech, pauseSpeech, resumeSpeech } from "@/lib/tts";
import type { LessonManifest } from "@/lib/types";

interface LessonPlayerProps {
  manifest: LessonManifest;
  onRestart: () => void;
}

export function LessonPlayer({ manifest, onRestart }: LessonPlayerProps) {
  const player = useLessonPlayer();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [xpPopupTrigger, setXpPopupTrigger] = useState(0);
  const [lastXpAmount, setLastXpAmount] = useState(0);
  const [scholarContents, setScholarContents] = useState<
    Record<string, string>
  >({});
  const [scholarFailed, setScholarFailed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [scholarLoading, setScholarLoading] = useState(false);
  const prevXpRef = useRef(0);
  const hasStartedRef = useRef(false);

  // Start lesson on mount
  useEffect(() => {
    if (!hasStartedRef.current) {
      hasStartedRef.current = true;
      player.startLesson(manifest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [manifest]);

  // Handle TTS narration
  useEffect(() => {
    if (
      player.playerState === "playing" &&
      player.currentSegment &&
      !isMuted
    ) {
      const content =
        player.panicExplanation ||
        (player.isScholarMode && scholarContents[player.currentSegment.id]
          ? scholarContents[player.currentSegment.id]
          : player.currentSegment.content);

      setIsSpeaking(true);
      speak(content, {
        rate: 1,
        onEnd: () => {
          setIsSpeaking(false);
          player.onNarrationEnd();
        },
      });
    }

    if (player.playerState === "paused") {
      pauseSpeech();
    }

    if (
      player.playerState === "quiz-active" ||
      player.playerState === "completed"
    ) {
      cancelSpeech();
      setIsSpeaking(false);
    }

    return () => {
      // Don't cancel on every re-render — only when unmounting
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    player.playerState,
    player.currentSegmentIndex,
    player.panicExplanation,
    isMuted,
    player.isScholarMode,
  ]);

  // XP popup trigger
  useEffect(() => {
    if (player.xp > prevXpRef.current) {
      const gained = player.xp - prevXpRef.current;
      setLastXpAmount(gained);
      setXpPopupTrigger((prev) => prev + 1);
      prevXpRef.current = player.xp;
    }
  }, [player.xp]);

  // Fetch scholar content on demand
  useEffect(() => {
    if (
      player.isScholarMode &&
      player.currentSegment &&
      !scholarContents[player.currentSegment.id]
    ) {
      setScholarFailed(false);
      setScholarLoading(true);
      const segment = player.currentSegment;
      fetch("/api/simplify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: segment.content,
          keyTerms: segment.keyTerms,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.simplifiedContent) {
            setScholarContents((prev) => ({
              ...prev,
              [segment.id]: data.simplifiedContent,
            }));
          }
        })
        .catch(() => {
          setScholarFailed(true);
        })
        .finally(() => {
          setScholarLoading(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.isScholarMode, player.currentSegment?.id]);

  const handleToggleSpeech = () => {
    if (player.playerState === "paused") {
      resumeSpeech();
      player.togglePause();
    } else if (player.playerState === "playing") {
      pauseSpeech();
      player.togglePause();
    }
  };

  const handleMuteToggle = () => {
    if (!isMuted) {
      cancelSpeech();
      setIsSpeaking(false);
    }
    setIsMuted(!isMuted);
  };

  const handleSkipNarration = () => {
    cancelSpeech();
    setIsSpeaking(false);
    player.onNarrationEnd();
  };

  const handleExit = () => {
    cancelSpeech();
    onRestart();
  };

  const handleShareResults = () => {
    const text = `I just completed "${manifest.title}" on NotesTok and earned ${player.xp} XP across ${player.totalSegments} segments! Built with AI-powered active recall.`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Completion-based progress: segment N of T = N/T after completing segment N
  // During a segment, show partial progress toward next milestone
  const baseProgress = (player.currentSegmentIndex / player.totalSegments) * 100;
  const segmentChunk = (1 / player.totalSegments) * 100;
  // Show half credit for being in a segment, full credit when quiz done
  const inSegmentBonus =
    player.playerState === "quiz-feedback" || player.playerState === "completed"
      ? segmentChunk
      : segmentChunk * 0.5;
  const progressPercent = Math.min(
    baseProgress + inSegmentBonus,
    player.playerState === "completed" ? 100 : 99
  );

  // Completion screen
  if (player.playerState === "completed") {
    const personaCallout = player.usedScholarMode
      ? "Global Scholar mode simplified content for your learning style"
      : player.usedPanicButton
        ? "The AI adapted explanations to match your understanding"
        : "Your brain just leveled up through active recall";

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
              <p className="text-lg font-bold">{player.totalSegments}</p>
              <p className="text-xs text-muted-foreground">Segments</p>
            </div>
            <div className="p-3 rounded-xl bg-card border text-center">
              <Zap className="w-5 h-5 mx-auto mb-1 text-yellow-500" />
              <p className="text-lg font-bold">{player.xp}</p>
              <p className="text-xs text-muted-foreground">XP Earned</p>
            </div>
            <div className="p-3 rounded-xl bg-card border text-center">
              <Clock className="w-5 h-5 mx-auto mb-1 text-blue-500" />
              <p className="text-lg font-bold">
                ~{manifest.estimatedMinutes}
              </p>
              <p className="text-xs text-muted-foreground">Minutes</p>
            </div>
          </div>

          {/* Persona callout */}
          <div className="p-3 rounded-lg bg-primary/5 border border-primary/10">
            <p className="text-sm text-muted-foreground">{personaCallout}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={handleExit}>
              <Home className="w-4 h-4 mr-2" />
              New Lesson
            </Button>
            <Button onClick={handleShareResults}>
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

  if (!player.currentSegment) return null;

  const displayContent =
    player.panicExplanation ||
    (player.isScholarMode && scholarContents[player.currentSegment.id]
      ? scholarContents[player.currentSegment.id]
      : player.currentSegment.content);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50">
      {/* Top bar */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b px-3 sm:px-4 py-2 sm:py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={handleExit}
              title="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <Badge variant="outline" className="text-xs shrink-0">
              {player.currentSegmentIndex + 1} / {player.totalSegments}
            </Badge>
            <span className="text-xs sm:text-sm font-medium truncate">
              {manifest.title}
            </span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <GlobalScholarToggle
              enabled={player.isScholarMode}
              onToggle={player.toggleScholar}
            />
            <XPCounter xp={player.xp} />
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-1.5 sm:mt-2">
          <Progress value={progressPercent} className="h-1.5" />
        </div>
      </div>

      {/* Main content — key forces remount + animation on segment change */}
      <div
        key={player.currentSegmentIndex}
        className="max-w-2xl mx-auto px-4 py-8 animate-segment-enter"
      >
        {/* Segment header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-4xl">{player.currentSegment.emoji}</span>
          <div>
            <h2 className="text-xl font-semibold">
              {player.currentSegment.title}
            </h2>
            <Badge variant="secondary" className="text-xs mt-1">
              {player.currentSegment.type}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg dark:prose-invert max-w-none mb-8">
          {player.panicExplanation && (
            <Badge
              variant="outline"
              className="mb-3 text-yellow-600 border-yellow-300"
            >
              <Lightbulb className="w-3 h-3 mr-1" />
              Simplified Explanation
            </Badge>
          )}
          {player.isScholarMode && scholarLoading && (
            <Badge
              variant="outline"
              className="mb-3 text-blue-600 border-blue-300 animate-pulse"
            >
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Simplifying for ESL...
            </Badge>
          )}
          {player.isScholarMode && scholarFailed && (
            <Badge
              variant="outline"
              className="mb-3 text-muted-foreground border-muted"
            >
              Simplification unavailable — showing original
            </Badge>
          )}
          <p className="text-lg leading-relaxed whitespace-pre-line">
            {renderContentWithKeyTerms(
              displayContent,
              player.currentSegment.keyTerms
            )}
          </p>
        </div>

        {/* Key terms */}
        {player.currentSegment.keyTerms.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            {player.currentSegment.keyTerms.map((term) => (
              <Badge key={term} variant="secondary" className="text-xs">
                {term}
              </Badge>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleToggleSpeech}
              disabled={
                player.playerState === "quiz-active" ||
                player.playerState === "panic-loading"
              }
            >
              {player.playerState === "paused" ? (
                <Play className="w-4 h-4" />
              ) : (
                <Pause className="w-4 h-4" />
              )}
            </Button>

            <Button variant="ghost" size="icon" onClick={handleMuteToggle}>
              {isMuted ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </Button>

            {isSpeaking && (
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <span className="flex gap-0.5 items-end h-3">
                  <span className="w-0.5 bg-green-500 rounded-full animate-sound-bar" style={{ animationDelay: "0ms" }} />
                  <span className="w-0.5 bg-green-500 rounded-full animate-sound-bar" style={{ animationDelay: "150ms" }} />
                  <span className="w-0.5 bg-green-500 rounded-full animate-sound-bar" style={{ animationDelay: "300ms" }} />
                </span>
                Speaking
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Panic button */}
            {player.playerState === "panic-loading" ? (
              <Button variant="outline" disabled>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Simplifying...
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={player.triggerPanic}
                className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50"
              >
                <Lightbulb className="w-4 h-4 mr-1" />
                Explain Simpler
              </Button>
            )}

            {/* Skip / Next — visible during playback, paused, or panic-loading */}
            {(player.playerState === "playing" ||
              player.playerState === "paused" ||
              player.playerState === "panic-loading") && (
              <Button
                variant={isMuted ? "outline" : "ghost"}
                size="sm"
                onClick={handleSkipNarration}
                className={isMuted ? "" : "text-muted-foreground"}
              >
                {isMuted || player.playerState === "paused" ? (
                  <>
                    Next
                    <ArrowRight className="w-3 h-3 ml-1" />
                  </>
                ) : (
                  <>
                    <SkipForward className="w-3 h-3 mr-1" />
                    Skip
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Quiz overlay */}
      {player.playerState === "quiz-active" && player.currentSegment.quiz && (
        <StopAndSolve
          quiz={player.currentSegment.quiz}
          attempts={player.quizAttempts}
          showingHint={player.showingHint}
          showingExplanation={player.showingExplanation}
          selectedAnswer={player.selectedAnswer}
          panicExplanation={player.panicExplanation}
          onAnswer={player.submitQuizAnswer}
          onContinue={player.nextSegment}
          onPanic={player.triggerPanic}
        />
      )}

      {/* Quiz feedback overlay */}
      {player.playerState === "quiz-feedback" &&
        player.currentSegment.quiz && (
          <StopAndSolve
            quiz={player.currentSegment.quiz}
            attempts={player.quizAttempts}
            showingHint={false}
            showingExplanation={true}
            selectedAnswer={player.selectedAnswer}
            panicExplanation={null}
            onAnswer={() => {}}
            onContinue={player.nextSegment}
            onPanic={() => {}}
          />
        )}

      {/* XP popup */}
      <XPPopup amount={lastXpAmount} trigger={xpPopupTrigger} />
    </div>
  );
}

function renderContentWithKeyTerms(
  content: string,
  keyTerms: string[]
): React.ReactNode {
  if (!keyTerms.length) return content;

  const regex = new RegExp(
    `(${keyTerms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`,
    "gi"
  );
  const parts = content.split(regex);

  return parts.map((part, i) => {
    const isKeyTerm = keyTerms.some(
      (t) => t.toLowerCase() === part.toLowerCase()
    );
    return isKeyTerm ? (
      <strong
        key={i}
        className="text-primary font-semibold underline decoration-primary/30 underline-offset-2"
      >
        {part}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    );
  });
}
