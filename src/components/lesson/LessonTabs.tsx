"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { VideosView } from "./VideosView";
import { CardsView } from "./CardsView";
import { QuizView } from "./QuizView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Play, Layers, HelpCircle } from "lucide-react";
import type { LessonManifest } from "@/lib/types";

interface LessonTabsProps {
  manifest: LessonManifest;
  onBack: () => void;
}

export function LessonTabs({ manifest, onBack }: LessonTabsProps) {
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
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs gap-1">
              <Zap className="w-3 h-3 text-yellow-500" />
              {manifest.totalXP} XP
            </Badge>
          </div>
        </div>
      </div>

      {/* Tabbed content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Tabs defaultValue="videos" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="videos" className="gap-1.5 text-xs sm:text-sm">
              <Play className="w-3.5 h-3.5" />
              Videos
            </TabsTrigger>
            <TabsTrigger value="cards" className="gap-1.5 text-xs sm:text-sm">
              <Layers className="w-3.5 h-3.5" />
              Cards
            </TabsTrigger>
            <TabsTrigger value="quiz" className="gap-1.5 text-xs sm:text-sm">
              <HelpCircle className="w-3.5 h-3.5" />
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="videos">
            <VideosView manifest={manifest} />
          </TabsContent>

          <TabsContent value="cards">
            <CardsView manifest={manifest} />
          </TabsContent>

          <TabsContent value="quiz">
            <QuizView manifest={manifest} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
