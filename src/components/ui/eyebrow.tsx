import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface EyebrowProps extends HTMLAttributes<HTMLSpanElement> {}

function Eyebrow({ className, ...props }: EyebrowProps) {
  return (
    <span
      className={cn(
        'text-xs font-semibold uppercase tracking-[0.12em] text-[var(--color-primary)]',
        className,
      )}
      {...props}
    />
  )
}

export { Eyebrow }
