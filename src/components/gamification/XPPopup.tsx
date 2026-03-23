"use client";

import { useEffect, useRef, useState } from "react";

interface XPPopupProps {
  amount: number;
  trigger: number; // increment this to trigger animation
}

export function XPPopup({ amount, trigger }: XPPopupProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger === 0) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setVisible(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setVisible(false), 1200);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [trigger]);

  if (!visible) return null;

  return (
    <div className="fixed top-1/3 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-xp-popup">
      <span className="text-3xl font-black text-yellow-500 drop-shadow-lg">
        +{amount} XP
      </span>
    </div>
  );
}
