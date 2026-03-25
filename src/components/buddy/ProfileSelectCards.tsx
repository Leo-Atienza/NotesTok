"use client";

import type { LearnerProfile } from "@/lib/types";

interface ProfileSelectCardsProps {
  onSelect: (profile: LearnerProfile) => void;
  disabled?: boolean;
}

const profiles: {
  id: LearnerProfile;
  emoji: string;
  title: string;
  description: string;
  color: string;
}[] = [
  {
    id: "focus-seeker",
    emoji: "⚡",
    title: "Focus Mode",
    description: "Short bursts & quizzes after every concept",
    color: "border-amber-500/50 hover:border-amber-500 hover:bg-amber-500/5",
  },
  {
    id: "multi-modal",
    emoji: "🎧",
    title: "Listen Mode",
    description: "Audio-first, great for commuting or multitasking",
    color: "border-blue-500/50 hover:border-blue-500 hover:bg-blue-500/5",
  },
  {
    id: "global-scholar",
    emoji: "🌍",
    title: "Global Scholar",
    description: "Simplified language, key terms preserved",
    color: "border-green-500/50 hover:border-green-500 hover:bg-green-500/5",
  },
];

export function ProfileSelectCards({ onSelect, disabled }: ProfileSelectCardsProps) {
  return (
    <div className="flex flex-col gap-2 w-full max-w-sm">
      {profiles.map((p) => (
        <button
          key={p.id}
          onClick={() => onSelect(p.id)}
          disabled={disabled}
          className={`flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${p.color} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <span className="text-2xl">{p.emoji}</span>
          <div>
            <div className="font-semibold text-sm">{p.title}</div>
            <div className="text-xs text-muted-foreground">{p.description}</div>
          </div>
        </button>
      ))}
    </div>
  );
}
