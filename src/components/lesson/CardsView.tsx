"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import type { LessonManifest } from "@/lib/types";

interface CardsViewProps {
  manifest: LessonManifest;
}

export function CardsView({ manifest }: CardsViewProps) {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const segment = manifest.segments[currentCard];

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

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Progress */}
      <div className="flex items-center gap-3">
        <Badge variant="outline" className="text-xs font-mono">
          {currentCard + 1} / {manifest.segments.length}
        </Badge>
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
              <p className="text-sm leading-relaxed text-foreground/90">
                {segment.content}
              </p>
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
