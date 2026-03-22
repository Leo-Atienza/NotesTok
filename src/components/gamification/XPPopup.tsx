"use client";

import { useEffect, useState } from "react";

interface XPPopupProps {
  amount: number;
  trigger: number; // increment this to trigger animation
}

export function XPPopup({ amount, trigger }: XPPopupProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (trigger === 0) return;
    setVisible(true);
    const timer = setTimeout(() => setVisible(false), 1200);
    return () => clearTimeout(timer);
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
