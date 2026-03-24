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
  Brain,
  FileText,
} from "lucide-react";
import { VideoPlayer } from "@/components/video/VideoPlayer";
import { speak, cancelSpeech, pauseSpeech, resumeSpeech } from "@/lib/tts";
import type { LessonManifest } from "@/lib/types";

interface LessonPlayerProps {
  manifest: LessonManifest;
  onRestart: () => void;
}

type VideoMode = "classic" | "brainrot" | "fireship";

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
  const [videoMode, setVideoMode] = useState<VideoMode | null>(null);
  const [segmentImages, setSegmentImages] = useState<Record<string, string>>({});
  // Per-scene images: segmentId → array of image URLs
  const [sceneImages, setSceneImages] = useState<Record<string, string[]>>({});
  const [imagesLoading, setImagesLoading] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [mediaLoadingStep, setMediaLoadingStep] = useState("");
  const [enrichedManifest, setEnrichedManifest] = useState<LessonManifest>(manifest);
  const prevXpRef = useRef(0);
  const hasStartedRef = useRef(false);

  // Start lesson after mode is selected AND media is resolved
  useEffect(() => {
    if (videoMode && !hasStartedRef.current && !mediaLoading) {
      hasStartedRef.current = true;
      player.startLesson(enrichedManifest);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enrichedManifest, videoMode, mediaLoading]);

  // Resolve media + voiceover when a video mode is selected
  useEffect(() => {
    if (!videoMode || videoMode === "classic") return;
    if (hasStartedRef.current) return;

    setMediaLoading(true);

    (async () => {
      const updated = { ...manifest, segments: manifest.segments.map((s) => ({ ...s })) };

      // Phase 1: Resolve stock media (videos/photos from Pexels/DB)
      setMediaLoadingStep("Finding visual materials...");
      try {
        const mediaRes = await fetch("/api/media/resolve", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: manifest.segments.map((s) => ({
              id: s.id,
              keyTerms: s.keyTerms,
              title: s.title,
              type: s.type,
            })),
            subject: manifest.subject,
          }),
        });
        const mediaData = await mediaRes.json();

        // Attach media to segments
        if (mediaData.segmentMedia) {
          for (const seg of updated.segments) {
            const media = mediaData.segmentMedia[seg.id];
            if (!media) continue;
            if (media.videos?.[0]?.url) seg.backgroundVideoUrl = media.videos[0].url;
            if (media.photos?.[0]?.url) seg.backgroundPhotoUrl = media.photos[0].url;
            if (media.photos?.length > 1) {
              seg.scenePhotoUrls = media.photos.map((p: { url: string }) => p.url);
            }
          }
          if (mediaData.music) updated.backgroundMusicUrl = mediaData.music;
          if (mediaData.sfx) updated.transitionSfxUrl = mediaData.sfx;
        }
      } catch {
        // Graceful — continue without stock media
      }

      // Phase 2: Generate voiceover (parallel with Gemini images)
      setMediaLoadingStep("Generating voiceover...");
      const [voiceoverResult] = await Promise.allSettled([
        fetch("/api/media/voiceover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            segments: manifest.segments.map((s) => ({ id: s.id, content: s.content })),
          }),
        }).then((r) => r.json()),
      ]);

      if (voiceoverResult.status === "fulfilled" && voiceoverResult.value.voiceovers) {
        for (const seg of updated.segments) {
          const voUrl = voiceoverResult.value.voiceovers[seg.id];
          if (voUrl) seg.voiceoverUrl = voUrl;
        }
      }

      // Phase 3: Also generate Gemini images as fallback (existing behavior)
      setMediaLoadingStep("Preparing visuals...");
      for (const segment of updated.segments) {
        // Skip if we already have stock media
        if (segment.backgroundVideoUrl || segment.backgroundPhotoUrl) continue;

        const prompts = segment.sceneImagePrompts;
        if (prompts && prompts.length > 0) {
          const batchSize = 3;
          for (let i = 0; i < prompts.length; i += batchSize) {
            const batch = prompts.slice(i, i + batchSize);
            const results = await Promise.allSettled(
              batch.map((prompt) =>
                fetch("/api/generate-image", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ prompt }),
                }).then((r) => r.json())
              )
            );
            const newUrls: string[] = [];
            for (const result of results) {
              if (result.status === "fulfilled" && result.value.imageUrl) {
                newUrls.push(result.value.imageUrl);
              }
            }
            if (newUrls.length > 0) {
              setSceneImages((prev) => ({
                ...prev,
                [segment.id]: [...(prev[segment.id] || []), ...newUrls],
              }));
            }
          }
          await new Promise((r) => setTimeout(r, 800));
        } else if (segment.imagePrompt) {
          try {
            const res = await fetch("/api/generate-image", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ prompt: segment.imagePrompt }),
            });
            const data = await res.json();
            if (data.imageUrl) {
              setSegmentImages((prev) => ({ ...prev, [segment.id]: data.imageUrl }));
            }
          } catch { /* Graceful fallback */ }
          await new Promise((r) => setTimeout(r, 1000));
        }
      }

      setEnrichedManifest(updated);
      setMediaLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoMode]);

  // Handle TTS narration (skip when ElevenLabs voiceover is active)
  useEffect(() => {
    if (
      player.playerState === "playing" &&
      player.currentSegment &&
      !isMuted
    ) {
      // Skip Web Speech if ElevenLabs voiceover is available — VideoPlayer handles it
      if (player.currentSegment.voiceoverUrl && videoMode !== "classic") {
        return;
      }

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

  // Handle video segment completion (for brainrot/fireship modes)
  const handleVideoSegmentComplete = () => {
    // If there's a quiz, the hook handles it via onNarrationEnd
    player.onNarrationEnd();
  };

  // Mode picker screen
  if (!videoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-8 max-w-lg animate-fade-in">
          <div>
            <h2 className="text-2xl font-bold mb-2">Choose Your Style</h2>
            <p className="text-muted-foreground text-sm">
              How do you want to learn &ldquo;{manifest.title}&rdquo;?
            </p>
          </div>

          <div className="grid gap-3">
            {/* Brainrot mode */}
            <button
              onClick={() => setVideoMode("brainrot")}
              className="group relative flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-card hover:border-yellow-500/50 hover:bg-yellow-500/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
                <Brain className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Brainrot Mode</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  TikTok-style video with animated captions &amp; visuals
                </p>
              </div>
              <Badge className="absolute top-2 right-2 bg-yellow-500/10 text-yellow-600 border-yellow-500/20 text-[10px]">
                NEW
              </Badge>
            </button>

            {/* Fireship mode */}
            <button
              onClick={() => setVideoMode("fireship")}
              className="group relative flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-card hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                <Zap className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Fireship Mode</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Fast-paced explainer with typewriter code style
                </p>
              </div>
              <Badge className="absolute top-2 right-2 bg-blue-500/10 text-blue-600 border-blue-500/20 text-[10px]">
                NEW
              </Badge>
            </button>

            {/* Classic mode */}
            <button
              onClick={() => setVideoMode("classic")}
              className="group flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-card hover:border-primary/50 hover:bg-primary/5 transition-all text-left"
            >
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-base">Classic Mode</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Text cards with narration &amp; interactive quizzes
                </p>
              </div>
            </button>
          </div>

          <Button variant="ghost" size="sm" onClick={handleExit} className="text-muted-foreground">
            <ArrowLeft className="w-3 h-3 mr-1" />
            Back
          </Button>
        </div>
      </div>
    );
  }

  // Media loading screen
  if (mediaLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
        <div className="text-center space-y-6 max-w-md animate-fade-in">
          <div className="w-16 h-16 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
          <div>
            <h2 className="text-xl font-bold mb-2">Preparing Your Lesson</h2>
            <p className="text-sm text-muted-foreground">{mediaLoadingStep}</p>
          </div>
          <div className="flex justify-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "200ms" }} />
            <span className="w-2 h-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: "400ms" }} />
          </div>
        </div>
      </div>
    );
  }

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

      {/* Main content area */}
      {videoMode !== "classic" && player.currentSegment ? (
        /* Video mode: Brainrot or Fireship — full-width on mobile */
        <div key={player.currentSegmentIndex} className="px-0 sm:px-2 py-2 sm:py-4 max-w-lg mx-auto animate-segment-enter">
          <VideoPlayer
            segment={{
              ...player.currentSegment,
              imageUrl: segmentImages[player.currentSegment.id] || undefined,
            }}
            mode={videoMode as "brainrot" | "fireship"}
            onComplete={handleVideoSegmentComplete}
            isPaused={
              player.playerState === "quiz-active" ||
              player.playerState === "quiz-feedback" ||
              player.playerState === "panic-loading"
            }
            sceneImages={sceneImages[player.currentSegment.id] || undefined}
            voiceoverUrl={player.currentSegment.voiceoverUrl}
            backgroundMusicUrl={enrichedManifest.backgroundMusicUrl}
            transitionSfxUrl={enrichedManifest.transitionSfxUrl}
          />
        </div>
      ) : (
        /* Classic mode — original text-based player */
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
      )}

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
