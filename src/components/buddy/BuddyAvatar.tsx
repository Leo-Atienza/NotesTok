"use client";

interface BuddyAvatarProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "w-8 h-8 text-lg",
  md: "w-10 h-10 text-xl",
  lg: "w-14 h-14 text-3xl",
};

export function BuddyAvatar({ size = "md", className = "" }: BuddyAvatarProps) {
  return (
    <div
      className={`rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shrink-0 ${sizeMap[size]} ${className}`}
    >
      <span role="img" aria-label="study buddy">
        🧠
      </span>
    </div>
  );
}
