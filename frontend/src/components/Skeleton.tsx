interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => (
  <div className={`animate-pulse rounded-md bg-secondary/70 ${className}`} />
);

export const SongRowSkeleton = () => (
  <div className="grid grid-cols-[28px_48px_1fr_auto] items-center gap-3 px-4 py-2.5">
    <Skeleton className="w-4 h-4" />
    <Skeleton className="w-12 h-12 rounded-lg" />
    <div className="space-y-2 min-w-0">
      <Skeleton className="h-3 w-2/3" />
      <Skeleton className="h-2.5 w-1/3" />
    </div>
    <Skeleton className="h-3 w-10" />
  </div>
);

export const SongSectionSkeleton = ({ rows = 4 }: { rows?: number }) => (
  <section className="mb-8">
    <div className="px-4 pt-2 pb-3">
      <Skeleton className="h-5 w-32" />
    </div>
    <div className="px-1 space-y-1">
      {Array.from({ length: rows }).map((_, i) => (
        <SongRowSkeleton key={i} />
      ))}
    </div>
  </section>
);

export const ArtistCardSkeleton = () => (
  <div className="flex flex-col items-center gap-2 p-3">
    <Skeleton className="w-20 h-20 rounded-full" />
    <Skeleton className="h-3 w-16" />
    <Skeleton className="h-2.5 w-12" />
  </div>
);

export const TrendingHeroSkeleton = () => (
  <section className="px-4 pt-4 pb-2">
    <div className="flex items-baseline justify-between mb-3">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-3 w-12" />
    </div>
    <div className="flex gap-3 overflow-hidden -mx-4 px-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="shrink-0 w-44 sm:w-52">
          <Skeleton className="w-44 h-44 sm:w-52 sm:h-52 rounded-2xl shadow-lg" />
          <Skeleton className="h-3.5 w-3/4 mt-3" />
          <Skeleton className="h-3 w-1/2 mt-1.5" />
        </div>
      ))}
    </div>
  </section>
);
