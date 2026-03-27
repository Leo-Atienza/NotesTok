"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Brain,
  Zap,
  FileText,
  ArrowLeft,
} from "lucide-react";

type VideoMode = "classic" | "brainrot" | "fireship" | "aistory" | "whiteboard";

interface ModePickerProps {
  title: string;
  onSelect: (mode: VideoMode) => void;
  onBack: () => void;
}

const MODES: {
  id: VideoMode;
  name: string;
  desc: string;
  icon: typeof Brain;
  badge?: string;
  iconClass: string;
  iconBgClass: string;
  hoverClass: string;
  badgeClass: string;
}[] = [
  {
    id: "brainrot",
    name: "Brainrot Mode",
    desc: "TikTok-style video with animated captions & visuals",
    icon: Brain,
    badge: "NEW",
    iconClass: "text-yellow-500",
    iconBgClass: "bg-yellow-500/10",
    hoverClass: "hover:border-yellow-500/50 hover:bg-yellow-500/5",
    badgeClass: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  },
  {
    id: "fireship",
    name: "Fireship Mode",
    desc: "Fast-paced explainer with typewriter code style",
    icon: Zap,
    badge: "NEW",
    iconClass: "text-blue-500",
    iconBgClass: "bg-blue-500/10",
    hoverClass: "hover:border-blue-500/50 hover:bg-blue-500/5",
    badgeClass: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  },
  {
    id: "aistory",
    name: "AI Story Mode",
    desc: "Cinematic narration with AI visuals & smooth pans",
    icon: Brain,
    badge: "HOT",
    iconClass: "text-purple-500",
    iconBgClass: "bg-purple-500/10",
    hoverClass: "hover:border-purple-500/50 hover:bg-purple-500/5",
    badgeClass: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  },
  {
    id: "whiteboard",
    name: "Whiteboard Mode",
    desc: "Hand-drawn explainer style with panning canvas",
    icon: FileText,
    badge: "NEW",
    iconClass: "text-gray-500",
    iconBgClass: "bg-gray-500/10",
    hoverClass: "hover:border-gray-500/50 hover:bg-gray-500/5",
    badgeClass: "bg-gray-500/10 text-gray-600 border-gray-500/20",
  },
  {
    id: "classic",
    name: "Classic Mode",
    desc: "Text cards with narration & interactive quizzes",
    icon: FileText,
    iconClass: "text-primary",
    iconBgClass: "bg-primary/10",
    hoverClass: "hover:border-primary/50 hover:bg-primary/5",
    badgeClass: "bg-primary/10 text-primary border-primary/20",
  },
];

export function ModePicker({ title, onSelect, onBack }: ModePickerProps) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-background to-muted">
      <div className="text-center space-y-8 max-w-lg animate-fade-in">
        <div>
          <h2 className="text-2xl font-bold mb-2">Choose Your Style</h2>
          <p className="text-muted-foreground text-sm">
            How do you want to learn &ldquo;{title}&rdquo;?
          </p>
        </div>

        <div className="grid gap-3">
          {MODES.map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                onClick={() => onSelect(mode.id)}
                className={`group relative flex items-center gap-4 p-4 rounded-xl border-2 border-transparent bg-card transition-all text-left ${mode.hoverClass}`}
              >
                <div
                  className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${mode.iconBgClass}`}
                >
                  <Icon className={`w-6 h-6 ${mode.iconClass}`} />
                </div>
                <div>
                  <h3 className="font-semibold text-base">{mode.name}</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {mode.desc}
                  </p>
                </div>
                {mode.badge && (
                  <Badge
                    className={`absolute top-2 right-2 ${mode.badgeClass} text-[10px]`}
                  >
                    {mode.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground"
        >
          <ArrowLeft className="w-3 h-3 mr-1" />
          Back
        </Button>
      </div>
    </div>
  );
}
