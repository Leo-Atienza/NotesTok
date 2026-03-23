"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertCircle,
  CheckCircle2,
  Lightbulb,
  ArrowRight,
  Loader2,
} from "lucide-react";
import type { QuizCheckpoint } from "@/lib/types";

interface StopAndSolveProps {
  quiz: QuizCheckpoint;
  attempts: number;
  showingHint: boolean;
  showingExplanation: boolean;
  selectedAnswer: number | null;
  panicExplanation: string | null;
  onAnswer: (index: number) => void;
  onContinue: () => void;
  onPanic: () => void;
}

export function StopAndSolve({
  quiz,
  attempts,
  showingHint,
  showingExplanation,
  selectedAnswer,
  panicExplanation,
  onAnswer,
  onContinue,
  onPanic,
}: StopAndSolveProps) {
  const [animatingWrong, setAnimatingWrong] = useState(false);
  const [lastWrongIndex, setLastWrongIndex] = useState<number | null>(null);
  const [isPanicking, setIsPanicking] = useState(false);
  const isCorrect = selectedAnswer === quiz.correctIndex;
  const isAnswered = selectedAnswer !== null && isCorrect;

  const handleAnswer = (index: number) => {
    if (isAnswered) return;

    if (index !== quiz.correctIndex) {
      setAnimatingWrong(true);
      setLastWrongIndex(index);
      setTimeout(() => setAnimatingWrong(false), 600);
    }
    onAnswer(index);
  };

  const handlePanic = () => {
    setIsPanicking(true);
    onPanic();
    // isPanicking will remain true — the panic explanation will show inline
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <Card
        className={`w-full max-w-lg p-5 sm:p-6 space-y-4 sm:space-y-5 rounded-t-2xl sm:rounded-xl max-h-[90vh] overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300 ${
          isAnswered ? "ring-2 ring-green-500/30 animate-celebrate" : ""
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <Badge variant="secondary" className="text-sm font-semibold">
            Stop & Solve
          </Badge>
          <Badge variant="outline" className="text-xs">
            +{quiz.xpReward} XP
          </Badge>
        </div>

        {/* Question */}
        <h3 className="text-lg font-semibold leading-snug">{quiz.question}</h3>

        {/* Panic explanation (inline, shown when triggered from quiz) */}
        {panicExplanation && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg animate-fade-in">
            <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-600 shrink-0" />
            <div>
              <p className="text-xs font-medium text-yellow-700 mb-1">
                Simpler Explanation
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                {panicExplanation}
              </p>
            </div>
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {quiz.options.map((option, index) => {
            let variant: "outline" | "default" | "destructive" = "outline";
            let className = "w-full justify-start text-left h-auto py-3 px-4";

            if (isAnswered) {
              if (index === quiz.correctIndex) {
                className +=
                  " bg-green-500/10 border-green-500 text-green-700 dark:text-green-400";
              } else if (index === selectedAnswer) {
                variant = "destructive";
              }
            } else if (
              animatingWrong &&
              lastWrongIndex === index
            ) {
              // Use local animatingWrong state as source of truth for shake
              className += " animate-shake border-red-400";
            } else if (
              !animatingWrong &&
              selectedAnswer === index &&
              selectedAnswer !== quiz.correctIndex
            ) {
              // Show red border on previous wrong answer (no shake)
              className += " border-red-300";
            }

            return (
              <Button
                key={index}
                variant={variant}
                className={className}
                onClick={() => handleAnswer(index)}
                disabled={isAnswered}
              >
                <span className="mr-3 font-mono text-sm opacity-60">
                  {String.fromCharCode(65 + index)}
                </span>
                {option}
              </Button>
            );
          })}
        </div>

        {/* Hint */}
        {showingHint && !isAnswered && (
          <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg animate-in fade-in duration-300">
            <Lightbulb className="w-4 h-4 mt-0.5 text-yellow-600 shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              {quiz.hint}
            </p>
          </div>
        )}

        {/* Wrong answer explanation (after 2nd wrong) */}
        {showingExplanation && !isAnswered && (
          <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-in fade-in duration-300">
            <AlertCircle className="w-4 h-4 mt-0.5 text-blue-600 shrink-0" />
            <div>
              <p className="text-sm text-blue-800 dark:text-blue-300">
                {quiz.explanation}
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                The answer is:{" "}
                <strong>{quiz.options[quiz.correctIndex]}</strong>
              </p>
            </div>
          </div>
        )}

        {/* Correct answer feedback with celebration */}
        {isAnswered && (
          <div className="relative">
            <div className="flex items-start gap-2 p-3 bg-green-500/10 border border-green-500/20 rounded-lg animate-celebrate">
              <CheckCircle2 className="w-5 h-5 mt-0.5 text-green-600 shrink-0" />
              <div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  Correct! +{quiz.xpReward} XP
                </p>
                <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                  {quiz.explanation}
                </p>
              </div>
            </div>
            {/* Confetti dots */}
            <ConfettiDots />
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between items-center pt-2">
          {/* Panic button appears after 2+ wrong answers */}
          {attempts >= 2 && !isAnswered ? (
            isPanicking && !panicExplanation ? (
              <Button variant="ghost" size="sm" disabled>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Simplifying...
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={handlePanic}>
                <Lightbulb className="w-4 h-4 mr-1" />
                Explain It Simpler
              </Button>
            )
          ) : (
            <div />
          )}

          {isAnswered && (
            <Button onClick={onContinue}>
              Continue
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}

function ConfettiDots() {
  const colors = [
    "bg-green-400",
    "bg-yellow-400",
    "bg-primary",
    "bg-blue-400",
    "bg-green-500",
    "bg-amber-400",
  ];
  const positions = [
    { top: "-8px", left: "10%" },
    { top: "-6px", right: "15%" },
    { bottom: "-8px", left: "20%" },
    { bottom: "-6px", right: "10%" },
    { top: "50%", left: "-8px" },
    { top: "40%", right: "-8px" },
  ];

  return (
    <>
      {colors.map((color, i) => (
        <span
          key={i}
          className={`absolute w-2 h-2 rounded-full ${color} animate-celebrate`}
          style={{
            ...positions[i],
            animationDelay: `${i * 80}ms`,
            opacity: 0.8,
          }}
        />
      ))}
    </>
  );
}
