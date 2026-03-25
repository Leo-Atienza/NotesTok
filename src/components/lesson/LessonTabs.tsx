"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideosView } from "./VideosView";
import { CardsView } from "./CardsView";
import { QuizView } from "./QuizView";
import { ListenView } from "./ListenView";
import { BuddyChatDrawer } from "@/components/buddy/BuddyChatDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LockedInMode } from "@/components/locked-in/LockedInMode";
import { ProgressDashboard } from "@/components/progression/ProgressDashboard";
import {
  ArrowLeft,
  Zap,
  Play,
  Layers,
  HelpCircle,
  Headphones,
  MessageCircle,
  Microscope,
  Lock,
  BarChart3,
} from "lucide-react";
import type { LessonManifest, LearnerProfile } from "@/lib/types";

interface LessonTabsProps {
  manifest: LessonManifest;
  onBack: () => void;
}

type TabConfig = { value: string; label: string; icon: React.ReactNode };

function getTabOrder(profile?: LearnerProfile): { tabs: TabConfig[]; defaultTab: string } {
  const videos: TabConfig = { value: "videos", label: "Videos", icon: <Play className="w-3.5 h-3.5" /> };
  const listen: TabConfig = { value: "listen", label: "Listen", icon: <Headphones className="w-3.5 h-3.5" /> };
  const cards: TabConfig = { value: "cards", label: "Cards", icon: <Layers className="w-3.5 h-3.5" /> };
  const quiz: TabConfig = { value: "quiz", label: "Quiz", icon: <HelpCircle className="w-3.5 h-3.5" /> };

  switch (profile) {
    case "multi-modal":
      return { tabs: [listen, cards, videos, quiz], defaultTab: "listen" };
    case "global-scholar":
      return { tabs: [cards, quiz, listen, videos], defaultTab: "cards" };
    case "focus-seeker":
    default:
      return { tabs: [videos, quiz, cards, listen], defaultTab: "videos" };
  }
}

export function LessonTabs({ manifest, onBack }: LessonTabsProps) {
  const { tabs, defaultTab } = getTabOrder(manifest.learnerProfile);
  const [showBuddy, setShowBuddy] = useState(false);
  const [showLockedIn, setShowLockedIn] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  const [superDetail, setSuperDetail] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-8 w-8"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-sm font-semibold truncate">{manifest.title}</h1>
              <p className="text-xs text-muted-foreground">
                {manifest.segments.length} segments
                {manifest.learnerProfile && (
                  <> &middot; {manifest.learnerProfile === "focus-seeker" ? "⚡ Focus" : manifest.learnerProfile === "multi-modal" ? "🎧 Listen" : "🌍 Scholar"}</>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Super Detail toggle */}
            <button
              onClick={() => setSuperDetail(!superDetail)}
              className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium border transition-colors ${
                superDetail
                  ? "bg-purple-500/10 border-purple-500/50 text-purple-600"
                  : "bg-muted border-transparent text-muted-foreground hover:text-foreground"
              }`}
              title="Toggle super-detailed breakdowns"
            >
              <Microscope className="w-3 h-3" />
              Detail
            </button>
            <button
              onClick={() => setShowLockedIn(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground border border-transparent transition-colors"
              title="Start focus timer"
            >
              <Lock className="w-3 h-3" />
              <span className="hidden sm:inline">Focus</span>
            </button>
            <button
              onClick={() => setShowProgress(true)}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-medium bg-muted text-muted-foreground hover:text-foreground border border-transparent transition-colors"
              title="View progress"
            >
              <BarChart3 className="w-3 h-3" />
            </button>
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              {manifest.totalXP} XP
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className={`grid w-full mb-6`} style={{ gridTemplateColumns: `repeat(${tabs.length}, 1fr)` }}>
            {tabs.map((tab) => (
              <TabsTrigger key={tab.value} value={tab.value} className="gap-1.5 text-xs sm:text-sm">
                {tab.icon}
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="videos">
            <VideosView manifest={manifest} />
          </TabsContent>

          <TabsContent value="listen">
            <ListenView manifest={manifest} />
          </TabsContent>

          <TabsContent value="cards">
            <CardsView manifest={manifest} />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizView manifest={manifest} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Floating buddy chat button */}
      <button
        onClick={() => setShowBuddy(true)}
        className="fixed bottom-6 right-6 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center"
        title="Ask your study buddy"
      >
        <MessageCircle className="w-5 h-5" />
      </button>

      {/* Buddy chat drawer */}
      {showBuddy && (
        <BuddyChatDrawer
          manifest={manifest}
          currentSegmentIdx={0}
          onClose={() => setShowBuddy(false)}
        />
      )}

      {/* Locked-In Mode */}
      {showLockedIn && (
        <LockedInMode onClose={() => setShowLockedIn(false)} />
      )}

      {/* Progress Dashboard */}
      {showProgress && (
        <ProgressDashboard onClose={() => setShowProgress(false)} />
      )}
    </div>
  );
}
