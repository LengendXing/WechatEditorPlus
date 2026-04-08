interface SkeletonProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  rounded?: string;
}

export default function Skeleton({
  className = "",
  width,
  height,
  rounded = "rounded-[8px]",
}: SkeletonProps) {
  return (
    <div
      className={`bg-border-primary animate-[skeleton-pulse_1.5s_ease-in-out_infinite] ${rounded} ${className}`}
      style={{ width, height }}
    />
  );
}

export function ArticleCardSkeleton() {
  return (
    <div className="rounded-[12px] border border-border-primary bg-surface-secondary overflow-hidden">
      <Skeleton className="w-full" height={140} rounded="rounded-none" />
      <div className="p-3.5 flex flex-col gap-2">
        <Skeleton width="70%" height={16} />
        <Skeleton width="90%" height={12} />
        <div className="flex items-center gap-2 mt-1">
          <Skeleton width={50} height={10} />
          <Skeleton width={70} height={10} />
        </div>
      </div>
    </div>
  );
}
