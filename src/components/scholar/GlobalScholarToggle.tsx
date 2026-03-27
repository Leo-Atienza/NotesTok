"use client";

import { Globe } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface GlobalScholarToggleProps {
  enabled: boolean;
  onToggle: () => void;
}

export function GlobalScholarToggle({
  enabled,
  onToggle,
}: GlobalScholarToggleProps) {
  return (
    <button
      onClick={onToggle}
      className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 ${
        enabled
          ? "bg-blue-500/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-500/30"
          : "bg-muted text-muted-foreground hover:bg-muted/80"
      }`}
    >
      <Globe className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">Scholar</span>
      {enabled && (
        <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
          ON
        </Badge>
      )}
    </button>
  );
}
