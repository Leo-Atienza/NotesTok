export function LessonSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 animate-fade-in">
      {/* Top bar skeleton */}
      <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-sm border-b px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-6 rounded-full animate-shimmer" />
            <div className="w-32 h-4 rounded animate-shimmer" />
          </div>
          <div className="flex items-center gap-2">
            <div className="w-20 h-8 rounded-lg animate-shimmer" />
            <div className="w-16 h-8 rounded-lg animate-shimmer" />
          </div>
        </div>
        <div className="max-w-2xl mx-auto mt-2">
          <div className="h-1.5 rounded-full animate-shimmer" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Segment header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-lg animate-shimmer" />
          <div className="space-y-2">
            <div className="w-48 h-6 rounded animate-shimmer" />
            <div className="w-20 h-5 rounded-full animate-shimmer" />
          </div>
        </div>

        {/* Content lines */}
        <div className="space-y-3 mb-8">
          <div className="w-full h-5 rounded animate-shimmer" />
          <div className="w-11/12 h-5 rounded animate-shimmer" />
          <div className="w-full h-5 rounded animate-shimmer" />
          <div className="w-9/12 h-5 rounded animate-shimmer" />
          <div className="w-10/12 h-5 rounded animate-shimmer" />
        </div>

        {/* Key terms */}
        <div className="flex gap-2 mb-8">
          <div className="w-20 h-6 rounded-full animate-shimmer" />
          <div className="w-24 h-6 rounded-full animate-shimmer" />
          <div className="w-16 h-6 rounded-full animate-shimmer" />
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg animate-shimmer" />
            <div className="w-10 h-10 rounded-lg animate-shimmer" />
          </div>
          <div className="w-32 h-9 rounded-lg animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
