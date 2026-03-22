"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface XPCounterProps {
  xp: number;
}

export function XPCounter({ xp }: XPCounterProps) {
  const [displayXP, setDisplayXP] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (xp === displayXP) return;

    setIsAnimating(true);
    const diff = xp - displayXP;
    const steps = 10;
    const increment = diff / steps;
    let step = 0;

    const interval = setInterval(() => {
      step++;
      setDisplayXP((prev) => {
        const next = prev + increment;
        return step >= steps ? xp : Math.round(next);
      });
      if (step >= steps) {
        clearInterval(interval);
        setTimeout(() => setIsAnimating(false), 300);
      }
    }, 30);

    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [xp]);

  return (
    <div
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-semibold text-sm transition-all duration-300 ${
        isAnimating
          ? "bg-yellow-400/20 text-yellow-600 scale-110"
          : "bg-muted text-muted-foreground"
      }`}
    >
      <Zap
        className={`w-4 h-4 ${isAnimating ? "text-yellow-500" : ""}`}
        fill={isAnimating ? "currentColor" : "none"}
      />
      {displayXP} XP
    </div>
  );
}
