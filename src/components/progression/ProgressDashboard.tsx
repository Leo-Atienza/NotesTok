"use client";

import { useState, useEffect } from "react";
import { X, Zap, Flame, BookOpen, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getTotalStats, getStreak, getAllLessons } from "@/lib/lesson-store";
import type { StudyProgress } from "@/lib/types";

interface ProgressDashboardProps {
  onClose: () => void;
}

export function ProgressDashboard({ onClose }: ProgressDashboardProps) {
  const [stats, setStats] = useState<StudyProgress | null>(null);
  const [streak, setStreak] = useState(0);
  const [lessonCount, setLessonCount] = useState(0);

  useEffect(() => {
    setStats(getTotalStats());
    setStreak(getStreak());
    setLessonCount(getAllLessons().length);
  }, []);

  if (!stats) return null;

  const completedLessons = Object.values(stats.lessonProgress).filter(
    (lp) => lp.completedAt
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-background rounded-2xl border shadow-xl w-full max-w-sm mx-4 p-6 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold">Your Progress</h2>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <StatCard
            icon={<Zap className="w-5 h-5 text-yellow-500" />}
            label="Total XP"
            value={stats.totalXP.toLocaleString()}
            color="bg-yellow-500/10"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-orange-500" />}
            label="Study Streak"
            value={`${streak} day${streak !== 1 ? "s" : ""}`}
            color="bg-orange-500/10"
          />
          <StatCard
            icon={<BookOpen className="w-5 h-5 text-blue-500" />}
            label="Lessons Created"
            value={String(lessonCount)}
            color="bg-blue-500/10"
          />
          <StatCard
            icon={<Trophy className="w-5 h-5 text-purple-500" />}
            label="Completed"
            value={String(completedLessons)}
            color="bg-purple-500/10"
          />
        </div>

        {/* Focus sessions */}
        <FocusSessions />

        <p className="text-[10px] text-muted-foreground text-center mt-4">
          Keep studying to grow your stats!
        </p>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className={`rounded-xl p-3 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-[11px] text-muted-foreground font-medium">{label}</span>
      </div>
      <span className="text-xl font-bold">{value}</span>
    </div>
  );
}

function FocusSessions() {
  const [sessions, setSessions] = useState<{ date: string; duration: number }[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("notestok:focus-sessions");
      if (raw) setSessions(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  if (sessions.length === 0) return null;

  const totalMins = sessions.reduce((sum, s) => sum + Math.round(s.duration / 60), 0);

  return (
    <div className="border-t pt-4 mt-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Focus Sessions</span>
        <span className="text-xs text-muted-foreground">
          {sessions.length} sessions &middot; {totalMins} min total
        </span>
      </div>
    </div>
  );
}
