"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, Lock, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BuddyAvatar } from "@/components/buddy/BuddyAvatar";

interface LockedInModeProps {
  onClose: () => void;
  buddyName?: string;
}

const PRESETS = [
  { label: "25 min", seconds: 25 * 60 },
  { label: "50 min", seconds: 50 * 60 },
  { label: "90 min", seconds: 90 * 60 },
];

const MOTIVATIONAL = [
  "You're doing amazing! Keep going 💪",
  "Focus is a superpower. You've got this!",
  "Every minute counts toward mastery 🧠",
  "The grind pays off. Stay locked in!",
  "Your future self will thank you 🚀",
  "Knowledge is building, one minute at a time!",
  "You're in the zone! Don't stop now 🔥",
];

export function LockedInMode({ onClose, buddyName = "Toki" }: LockedInModeProps) {
  const [phase, setPhase] = useState<"select" | "active" | "done">("select");
  const [totalSeconds, setTotalSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [motivMsg, setMotivMsg] = useState(MOTIVATIONAL[0]);
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined);

  // beforeunload warning
  useEffect(() => {
    if (phase !== "active") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [phase]);

  // Timer
  useEffect(() => {
    if (phase !== "active") return;
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setPhase("done");
          // Save focus session
          try {
            const sessions = JSON.parse(localStorage.getItem("notestok:focus-sessions") || "[]");
            sessions.push({ date: new Date().toISOString(), duration: totalSeconds });
            localStorage.setItem("notestok:focus-sessions", JSON.stringify(sessions));
          } catch { /* ignore */ }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, [phase, totalSeconds]);

  // Rotate motivational messages
  useEffect(() => {
    if (phase !== "active") return;
    const id = setInterval(() => {
      setMotivMsg(MOTIVATIONAL[Math.floor(Math.random() * MOTIVATIONAL.length)]);
    }, 30000);
    return () => clearInterval(id);
  }, [phase]);

  const handleStart = (secs: number) => {
    setTotalSeconds(secs);
    setRemaining(secs);
    setPhase("active");
  };

  const handleClose = () => {
    if (phase === "active") {
      if (!confirm("Are you sure you want to break your focus session? Your progress won't be saved.")) {
        return;
      }
    }
    clearInterval(intervalRef.current);
    onClose();
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = totalSeconds > 0 ? ((totalSeconds - remaining) / totalSeconds) * 100 : 0;

  return (
    <div className="fixed inset-0 z-[60] bg-gradient-to-b from-gray-950 to-gray-900 flex flex-col items-center justify-center text-white">
      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
      >
        <X className="w-5 h-5 text-white/60" />
      </button>

      {phase === "select" && (
        <div className="text-center space-y-6 px-4">
          <Lock className="w-12 h-12 mx-auto text-purple-400" />
          <h2 className="text-2xl font-bold">Locked-In Mode</h2>
          <p className="text-sm text-white/60 max-w-xs mx-auto">
            Choose your focus duration. No distractions. Just you and your notes.
          </p>
          <div className="flex gap-3 justify-center">
            {PRESETS.map((p) => (
              <Button
                key={p.seconds}
                variant="outline"
                onClick={() => handleStart(p.seconds)}
                className="border-white/20 text-white hover:bg-white/10 hover:text-white"
              >
                {p.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {phase === "active" && (
        <div className="text-center space-y-8 px-4">
          {/* Circular progress */}
          <div className="relative w-56 h-56 mx-auto">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="44"
                fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="44"
                fill="none" stroke="url(#gradient)" strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 44}`}
                strokeDashoffset={`${2 * Math.PI * 44 * (1 - progress / 100)}`}
                className="transition-all duration-1000"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-4xl font-mono font-bold">
                {String(mins).padStart(2, "0")}:{String(secs).padStart(2, "0")}
              </span>
              <span className="text-xs text-white/40 mt-1">remaining</span>
            </div>
          </div>

          {/* Buddy message */}
          <div className="flex items-center gap-3 bg-white/5 rounded-xl px-4 py-3 max-w-xs mx-auto">
            <BuddyAvatar size="sm" />
            <p className="text-sm text-white/80">{motivMsg}</p>
          </div>
        </div>
      )}

      {phase === "done" && (
        <div className="text-center space-y-6 px-4">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-2xl font-bold">Session Complete! 🎉</h2>
          <p className="text-sm text-white/60">
            You stayed focused for {Math.round(totalSeconds / 60)} minutes. {buddyName} is proud of you!
          </p>
          <Button onClick={onClose} className="bg-white text-gray-900 hover:bg-white/90">
            Back to Lesson
          </Button>
        </div>
      )}
    </div>
  );
}
