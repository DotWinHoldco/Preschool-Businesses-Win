import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius,0.75rem)] bg-[var(--color-muted)]',
        'motion-safe:animate-pulse',
        className,
      )}
      aria-hidden="true"
      {...props}
    />
  )
}

export { Skeleton }
