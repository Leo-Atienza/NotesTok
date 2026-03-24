"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Trophy,
  Zap,
} from "lucide-react";
import type { LessonManifest, QuizCheckpoint } from "@/lib/types";

interface QuizViewProps {
  manifest: LessonManifest;
}

interface QuizState {
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  attempts: number;
  showHint: boolean;
  showExplanation: boolean;
}

export function QuizView({ manifest }: QuizViewProps) {
  const quizSegments = manifest.segments.filter((s) => s.quiz);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [quizState, setQuizState] = useState<QuizState>({
    selectedAnswer: null,
    isCorrect: null,
    attempts: 0,
    showHint: false,
    showExplanation: false,
  });

  if (quizSegments.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No quizzes in this lesson.
      </div>
    );
  }

  const segment = quizSegments[currentQuiz];
  const quiz = segment.quiz!;

  const handleAnswer = (index: number) => {
    if (quizState.isCorrect) return;

    const correct = index === quiz.correctIndex;
    const newAttempts = quizState.attempts + 1;

    setQuizState({
      selectedAnswer: index,
      isCorrect: correct,
      attempts: newAttempts,
      showHint: !correct && newAttempts >= 1,
      showExplanation: correct,
    });

    if (correct) {
      const xp = Math.max(
        Math.round((quiz.xpReward || 15) / newAttempts),
        5
      );
      setTotalXP((prev) => prev + xp);
    }
  };

  const handleNext = () => {
    if (currentQuiz < quizSegments.length - 1) {
      setCurrentQuiz((prev) => prev + 1);
      setQuizState({
        selectedAnswer: null,
        isCorrect: null,
        attempts: 0,
        showHint: false,
        showExplanation: false,
      });
    } else {
      setCompleted(true);
    }
  };

  if (completed) {
    return (
      <div className="flex flex-col items-center gap-4 py-8">
        <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
          <Trophy className="w-8 h-8 text-yellow-500" />
        </div>
        <h3 className="text-xl font-bold">All Quizzes Complete!</h3>
        <div className="flex items-center gap-2 text-yellow-500 font-bold text-lg">
          <Zap className="w-5 h-5" />
          {totalXP} XP earned
        </div>
        <Button
          variant="outline"
          onClick={() => {
            setCurrentQuiz(0);
            setTotalXP(0);
            setCompleted(false);
            setQuizState({
              selectedAnswer: null,
              isCorrect: null,
              attempts: 0,
              showHint: false,
              showExplanation: false,
            });
          }}
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4 max-w-lg mx-auto">
      {/* Progress + XP */}
      <div className="flex items-center justify-between w-full">
        <Badge variant="outline" className="text-xs font-mono">
          {currentQuiz + 1} / {quizSegments.length}
        </Badge>
        <div className="flex items-center gap-1 text-sm font-semibold text-yellow-600">
          <Zap className="w-4 h-4" />
          {totalXP} XP
        </div>
      </div>

      {/* Segment context */}
      <div className="text-center">
        <span className="text-3xl">{segment.emoji}</span>
        <p className="text-sm text-muted-foreground mt-1">{segment.title}</p>
      </div>

      {/* Question */}
      <Card className="w-full p-5">
        <h3 className="text-lg font-semibold mb-4">{quiz.question}</h3>

        <div className="space-y-2.5">
          {quiz.options.map((option, i) => {
            const isSelected = quizState.selectedAnswer === i;
            const isCorrectOption = i === quiz.correctIndex;
            const showCorrect = quizState.isCorrect && isCorrectOption;
            const showWrong = isSelected && !quizState.isCorrect && quizState.selectedAnswer !== null;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={quizState.isCorrect === true}
                className={`w-full text-left p-3.5 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  showCorrect
                    ? "border-green-500 bg-green-500/10 text-green-700 dark:text-green-400"
                    : showWrong
                      ? "border-red-400 bg-red-500/5 animate-shake"
                      : "border-border hover:border-primary/40 hover:bg-muted/50"
                }`}
              >
                <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + i)}
                </span>
                <span className="text-sm font-medium flex-1">{option}</span>
                {showCorrect && <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />}
                {showWrong && <XCircle className="w-5 h-5 text-red-400 shrink-0" />}
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {quizState.showHint && !quizState.isCorrect && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
              <Lightbulb className="w-4 h-4" />
              Hint
            </div>
            <p className="text-sm text-muted-foreground">{quiz.hint}</p>
          </div>
        )}

        {/* Explanation */}
        {quizState.showExplanation && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-foreground/80">{quiz.explanation}</p>
          </div>
        )}
      </Card>

      {/* Continue button */}
      {quizState.isCorrect && (
        <Button onClick={handleNext} className="gap-2">
          {currentQuiz < quizSegments.length - 1 ? "Next Question" : "Finish"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
