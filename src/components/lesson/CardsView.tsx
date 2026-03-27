"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, RotateCcw, Loader2, Microscope, Globe } from "lucide-react";
import type { LessonManifest } from "@/lib/types";

interface CardsViewProps {
  manifest: LessonManifest;
  superDetail?: boolean;
  scholarMode?: boolean;
}

export function CardsView({ manifest, superDetail = false, scholarMode = false }: CardsViewProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [detailedContent, setDetailedContent] = useState<Record<string, string>>({});
  const [scholarContent, setScholarContent] = useState<Record<string, string>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [loadingScholar, setLoadingScholar] = useState<string | null>(null);

  const segment = manifest.segments[currentCard];

  // Fetch super-detail when toggled on and card is flipped
  useEffect(() => {
    if (!superDetail || !flipped) return;
    if (detailedContent[segment.id]) return; // already fetched

    let cancelled = false;
    setLoadingDetail(segment.id);

    (async () => {
      try {
        const res = await fetch("/api/super-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: segment.content,
            title: segment.title,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.detailed) {
          setDetailedContent((prev) => ({ ...prev, [segment.id]: data.detailed }));
        }
      } catch {
        // Graceful — fall back to regular content
      } finally {
        if (!cancelled) setLoadingDetail(null);
      }
    })();

    return () => { cancelled = true; };
  }, [superDetail, flipped, segment.id, segment.content, segment.title, detailedContent]);

  // Fetch scholar-simplified content when scholar mode is on and card is flipped
  useEffect(() => {
    if (!scholarMode || !flipped) return;
    // Use pre-generated scholarContent from manifest if available
    if (segment.scholarContent) {
      setScholarContent((prev) => ({ ...prev, [segment.id]: segment.scholarContent! }));
      return;
    }
    if (scholarContent[segment.id]) return; // already fetched

    let cancelled = false;
    setLoadingScholar(segment.id);

    (async () => {
      try {
        const res = await fetch("/api/simplify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            content: segment.content,
            keyTerms: segment.keyTerms,
          }),
        });
        const data = await res.json();
        if (!cancelled && data.simplifiedContent) {
          setScholarContent((prev) => ({ ...prev, [segment.id]: data.simplifiedContent }));
        }
      } catch {
        // Graceful — fall back to regular content
      } finally {
        if (!cancelled) setLoadingScholar(null);
      }
    })();

    return () => { cancelled = true; };
  }, [scholarMode, flipped, segment.id, segment.content, segment.keyTerms, segment.scholarContent, scholarContent]);

  const goNext = () => {
    if (currentCard < manifest.segments.length - 1) {
      setFlipped(false);
      setTimeout(() => setCurrentCard((prev) => prev + 1), 150);
    }
  };

  const goPrev = () => {
    if (currentCard > 0) {
      setFlipped(false);
      setTimeout(() => setCurrentCard((prev) => prev - 1), 150);
    }
  };

  const displayContent =
    superDetail && detailedContent[segment.id]
      ? detailedContent[segment.id]
      : scholarMode && scholarContent[segment.id]
        ? scholarContent[segment.id]
        : segment.content;

  const isLoadingThis = loadingDetail === segment.id || loadingScholar === segment.id;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-mono">
          {currentCard + 1} / {manifest.segments.length}
        </Badge>
        {superDetail && (
          <Badge variant="secondary" className="text-xs gap-1 text-purple-600">
            <Microscope className="w-3 h-3" />
            Super Detail
          </Badge>
        )}
        {scholarMode && (
          <Badge variant="secondary" className="text-xs gap-1 text-blue-600">
            <Globe className="w-3 h-3" />
            Scholar
          </Badge>
        )}
        <div className="flex gap-1">
          {manifest.segments.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all ${
                i === currentCard
                  ? "bg-primary scale-125"
                  : i < currentCard
                    ? "bg-primary/40"
                    : "bg-muted"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Flashcard */}
      <div
        className="w-full max-w-[380px] aspect-[3/4] cursor-pointer"
        style={{ perspective: "1000px" }}
        onClick={() => setFlipped(!flipped)}
      >
        <div
          className="relative w-full h-full transition-transform duration-500"
          style={{
            transformStyle: "preserve-3d",
            transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
          }}
        >
          {/* Front */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 via-background to-muted/30 flex flex-col items-center justify-center gap-4 p-8 shadow-lg"
            style={{ backfaceVisibility: "hidden" }}
          >
            <span className="text-7xl">{segment.emoji}</span>
            <h3 className="text-2xl font-bold text-center leading-tight">
              {segment.title}
            </h3>
            <Badge
              variant="secondary"
              className="text-xs capitalize"
            >
              {segment.type}
            </Badge>
            <p className="text-xs text-muted-foreground mt-4">
              Tap to reveal
            </p>
          </div>

          {/* Back */}
          <div
            className="absolute inset-0 rounded-2xl border-2 border-primary/20 bg-gradient-to-br from-muted/30 via-background to-primary/5 flex flex-col p-6 shadow-lg overflow-y-auto"
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
            }}
          >
            <div className="flex-1 space-y-4">
              {isLoadingThis ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {loadingScholar === segment.id ? "Simplifying for ESL..." : "Generating detailed breakdown..."}
                </div>
              ) : (
                <p className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line">
                  {displayContent}
                </p>
              )}
              {segment.keyTerms.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Key Terms
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {segment.keyTerms.map((term) => (
                      <Badge
                        key={term}
                        variant="outline"
                        className="text-xs font-medium bg-primary/10 border-primary/30"
                      >
                        {term}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              Tap to flip back
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-3">
        <Button
          variant="outline"
          size="icon"
          onClick={goPrev}
          disabled={currentCard === 0}
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setFlipped(!flipped)}
          className="gap-1.5"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Flip
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={goNext}
          disabled={currentCard === manifest.segments.length - 1}
        >
          <ArrowRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
