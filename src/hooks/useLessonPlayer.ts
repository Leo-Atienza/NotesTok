"use client";

import { useState, useCallback } from "react";
import type { LessonManifest, PlayerState, Segment } from "@/lib/types";

interface LessonPlayerState {
  manifest: LessonManifest | null;
  playerState: PlayerState;
  currentSegmentIndex: number;
  xp: number;
  quizAttempts: number;
  isScholarMode: boolean;
  panicExplanation: string | null;
  showingHint: boolean;
  showingExplanation: boolean;
  selectedAnswer: number | null;
  usedScholarMode: boolean;
  usedPanicButton: boolean;
}

export function useLessonPlayer() {
  const [state, setState] = useState<LessonPlayerState>({
    manifest: null,
    playerState: "loading",
    currentSegmentIndex: 0,
    xp: 0,
    quizAttempts: 0,
    isScholarMode: false,
    panicExplanation: null,
    showingHint: false,
    showingExplanation: false,
    selectedAnswer: null,
    usedScholarMode: false,
    usedPanicButton: false,
  });

  const currentSegment: Segment | null =
    state.manifest?.segments[state.currentSegmentIndex] ?? null;

  const totalSegments = state.manifest?.segments.length ?? 0;

  const startLesson = useCallback((manifest: LessonManifest) => {
    setState({
      manifest,
      playerState: "playing",
      currentSegmentIndex: 0,
      xp: 0,
      quizAttempts: 0,
      isScholarMode: false,
      panicExplanation: null,
      showingHint: false,
      showingExplanation: false,
      selectedAnswer: null,
      usedScholarMode: false,
      usedPanicButton: false,
    });
  }, []);

  const onNarrationEnd = useCallback(() => {
    setState((prev) => {
      const segment = prev.manifest?.segments[prev.currentSegmentIndex];
      if (segment?.quiz) {
        return {
          ...prev,
          playerState: "quiz-active",
          quizAttempts: 0,
          showingHint: false,
          showingExplanation: false,
          selectedAnswer: null,
          panicExplanation: null,
        };
      }
      // No quiz — auto-advance or complete
      const isLast =
        prev.currentSegmentIndex >= (prev.manifest?.segments.length ?? 1) - 1;
      if (isLast) {
        return { ...prev, playerState: "completed" };
      }
      return {
        ...prev,
        currentSegmentIndex: prev.currentSegmentIndex + 1,
        panicExplanation: null,
      };
    });
  }, []);

  const submitQuizAnswer = useCallback((selectedIndex: number) => {
    setState((prev) => {
      const quiz = prev.manifest?.segments[prev.currentSegmentIndex]?.quiz;
      if (!quiz) return prev;

      const isCorrect = selectedIndex === quiz.correctIndex;
      const attempts = prev.quizAttempts + 1;

      if (isCorrect) {
        return {
          ...prev,
          playerState: "quiz-feedback",
          xp: prev.xp + quiz.xpReward,
          quizAttempts: attempts,
          selectedAnswer: selectedIndex,
          showingExplanation: true,
          showingHint: false,
        };
      }

      // Wrong answer
      return {
        ...prev,
        quizAttempts: attempts,
        selectedAnswer: selectedIndex,
        showingHint: attempts >= 1,
        showingExplanation: attempts >= 2,
      };
    });
  }, []);

  const nextSegment = useCallback(() => {
    setState((prev) => {
      const isLast =
        prev.currentSegmentIndex >= (prev.manifest?.segments.length ?? 1) - 1;
      if (isLast) {
        return { ...prev, playerState: "completed" };
      }
      return {
        ...prev,
        playerState: "playing",
        currentSegmentIndex: prev.currentSegmentIndex + 1,
        quizAttempts: 0,
        showingHint: false,
        showingExplanation: false,
        selectedAnswer: null,
        panicExplanation: null,
      };
    });
  }, []);

  const triggerPanic = useCallback(async () => {
    const segment = state.manifest?.segments[state.currentSegmentIndex];
    if (!segment) return;

    const wasInQuiz = state.playerState === "quiz-active";

    setState((prev) => ({
      ...prev,
      playerState: "panic-loading",
      usedPanicButton: true,
    }));

    try {
      const res = await fetch("/api/panic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          original: segment.content,
          concept: segment.title,
        }),
      });

      if (!res.ok) throw new Error("Failed to get simpler explanation");

      const data = await res.json();
      setState((prev) => ({
        ...prev,
        // Return to quiz if that's where panic was triggered from
        playerState: wasInQuiz ? "quiz-active" : "playing",
        panicExplanation: data.simplerExplanation,
      }));
    } catch {
      setState((prev) => ({
        ...prev,
        playerState: wasInQuiz ? "quiz-active" : "playing",
      }));
    }
  }, [state.manifest, state.currentSegmentIndex, state.playerState]);

  const toggleScholar = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isScholarMode: !prev.isScholarMode,
      usedScholarMode: true,
    }));
  }, []);

  const togglePause = useCallback(() => {
    setState((prev) => ({
      ...prev,
      playerState: prev.playerState === "playing" ? "paused" : "playing",
    }));
  }, []);

  return {
    ...state,
    currentSegment,
    totalSegments,
    startLesson,
    onNarrationEnd,
    submitQuizAnswer,
    nextSegment,
    triggerPanic,
    toggleScholar,
    togglePause,
  };
}
