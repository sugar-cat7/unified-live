import { cn } from "../../lib/cn";

type SkeletonProps = {
  className?: string;
};

const Skeleton = ({ className }: SkeletonProps) => {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      aria-hidden="true"
    />
  );
};

type SkeletonTextProps = {
  lines?: number;
  className?: string;
};

const SkeletonText = ({ lines = 3, className }: SkeletonTextProps) => {
  // Static skeleton lines - items never change order
  const skeletonLines = Array.from({ length: lines }, (_, i) => `line-${i}`);

  return (
    <div className={cn("space-y-2", className)} aria-hidden="true">
      {skeletonLines.map((lineKey, i) => (
        <Skeleton
          key={lineKey}
          className={cn("h-4", i === lines - 1 ? "w-3/4" : "w-full")}
        />
      ))}
    </div>
  );
};

export { Skeleton, SkeletonText };
