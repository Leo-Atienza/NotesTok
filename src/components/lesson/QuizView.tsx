"use client";

import { useState, useEffect, useRef, useReducer } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  ArrowRight,
  Lightbulb,
  Zap,
  Loader2,
  AlertCircle,
} from "lucide-react";
import type { LessonManifest, QuizCheckpoint } from "@/lib/types";
import { updateLessonProgress, recordStudySession } from "@/lib/lesson-store";
import { QuizComplete } from "./QuizComplete";

interface QuizViewProps {
  manifest: LessonManifest;
}

interface QuizState {
  selectedAnswer: number | null;
  isCorrect: boolean | null;
  attempts: number;
  showHint: boolean;
  showExplanation: boolean;
  panicExplanation: string | null;
  panicLoading: boolean;
  panicError: string | null;
}

type QuizAction =
  | { type: "ANSWER_SELECTED"; index: number; isCorrect: boolean }
  | { type: "PANIC_REQUESTED" }
  | { type: "PANIC_SUCCESS"; explanation: string }
  | { type: "PANIC_FAILED"; error: string }
  | { type: "NEXT_QUESTION" }
  | { type: "RESET" };

const initialState: QuizState = {
  selectedAnswer: null,
  isCorrect: null,
  attempts: 0,
  showHint: false,
  showExplanation: false,
  panicExplanation: null,
  panicLoading: false,
  panicError: null,
};

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case "ANSWER_SELECTED":
      const newAttempts = state.attempts + 1;
      return {
        ...state,
        selectedAnswer: action.index,
        isCorrect: action.isCorrect,
        attempts: newAttempts,
        showHint: !action.isCorrect && newAttempts >= 1,
        showExplanation: action.isCorrect,
      };
    case "PANIC_REQUESTED":
      return { ...state, panicLoading: true, panicError: null };
    case "PANIC_SUCCESS":
      return { ...state, panicLoading: false, panicExplanation: action.explanation };
    case "PANIC_FAILED":
      return { ...state, panicLoading: false, panicError: action.error };
    case "NEXT_QUESTION":
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

export function QuizView({ manifest }: QuizViewProps) {
  const quizSegments = manifest.segments.filter((s) => s.quiz);
  const [currentQuiz, setCurrentQuiz] = useState(0);
  const [totalXP, setTotalXP] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [state, dispatch] = useReducer(quizReducer, initialState);
  const sessionRecorded = useRef(false);

  // Record study session on first interaction
  useEffect(() => {
    if (!sessionRecorded.current) {
      sessionRecorded.current = true;
      recordStudySession();
    }
  }, []);

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
    if (state.isCorrect) return;

    const isCorrect = index === quiz.correctIndex;
    dispatch({ type: "ANSWER_SELECTED", index, isCorrect });

    if (isCorrect) {
      const xp = Math.max(
        Math.round((quiz.xpReward || 15) / (state.attempts + 1)),
        5
      );
      setTotalXP((prev) => prev + xp);
      updateLessonProgress(manifest.id, segment.id, true, xp);
    }
  };

  const handlePanic = async () => {
    if (state.panicLoading || state.panicExplanation) return;
    dispatch({ type: "PANIC_REQUESTED" });
    try {
      const res = await fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: segment.content,
          concept: segment.title,
        }),
      });
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      if (data.simplerExplanation) {
        dispatch({ type: "PANIC_SUCCESS", explanation: data.simplerExplanation });
      } else {
        throw new Error("No explanation returned");
      }
    } catch (e) {
      dispatch({ type: "PANIC_FAILED", error: "Failed to simplify. Please try again." });
    }
  };

  const handleNext = () => {
    if (currentQuiz < quizSegments.length - 1) {
      setCurrentQuiz((prev) => prev + 1);
      dispatch({ type: "NEXT_QUESTION" });
    } else {
      setCompleted(true);
    }
  };

  const handleReviewAgain = () => {
    setCurrentQuiz(0);
    setTotalXP(0);
    setCompleted(false);
    dispatch({ type: "RESET" });
  };

  if (completed) {
    return (
      <QuizComplete
        totalXP={totalXP}
        segmentsCount={quizSegments.length}
        subject={manifest.subject}
        onReviewAgain={handleReviewAgain}
      />
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
            const isSelected = state.selectedAnswer === i;
            const isCorrectOption = i === quiz.correctIndex;
            const showCorrect = state.isCorrect && isCorrectOption;
            const showWrong = isSelected && !state.isCorrect && state.selectedAnswer !== null;

            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={state.isCorrect === true}
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
        {state.showHint && !state.isCorrect && (
          <div className="mt-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <div className="flex items-center gap-2 text-sm font-medium text-yellow-600 dark:text-yellow-400 mb-1">
              <Lightbulb className="w-4 h-4" />
              Hint
            </div>
            <p className="text-sm text-muted-foreground">{quiz.hint}</p>
          </div>
        )}

        {/* Panic: simpler explanation (after 2+ wrong attempts) */}
        {state.attempts >= 2 && !state.isCorrect && (
          <div className="mt-3">
            {state.panicExplanation ? (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <div className="flex items-center gap-2 text-sm font-medium text-orange-600 dark:text-orange-400 mb-1">
                  <AlertCircle className="w-4 h-4" />
                  Simpler Explanation
                </div>
                <p className="text-sm text-muted-foreground">{state.panicExplanation}</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePanic}
                  disabled={state.panicLoading}
                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-500/10 self-start"
                >
                  {state.panicLoading ? (
                    <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                  ) : (
                    <Lightbulb className="w-4 h-4 mr-1" />
                  )}
                  {state.panicLoading ? "Simplifying..." : "Explain It Simpler"}
                </Button>
                {state.panicError && (
                  <p className="text-xs text-red-500 ml-2 animate-in fade-in">{state.panicError}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        {state.showExplanation && (
          <div className="mt-4 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
            <p className="text-sm text-foreground/80">{quiz.explanation}</p>
          </div>
        )}
      </Card>

      {/* Continue button */}
      {state.isCorrect && (
        <Button onClick={handleNext} className="gap-2">
          {currentQuiz < quizSegments.length - 1 ? "Next Question" : "Finish"}
          <ArrowRight className="w-4 h-4" />
        </Button>
      )}
    </div>
  );
}
