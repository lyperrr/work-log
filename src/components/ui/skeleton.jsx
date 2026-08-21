import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}) {
  return (
    <div
      data-slot="skeleton"
      className={cn("animate-pulse rounded-md bg-primary/20 dark:bg-primary/30 border border-primary/20", className)}
      {...props} />
  );
}

export { Skeleton }
