import { type HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type BadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger' | 'outline'
export type BadgeSize = 'sm' | 'md'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant
  size?: BadgeSize
}

const variantClasses: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]',
  secondary: 'bg-[var(--color-secondary)] text-[var(--color-secondary-foreground)]',
  success: 'bg-[var(--color-success)] text-white',
  warning: 'bg-[var(--color-warning)] text-white',
  danger: 'bg-[var(--color-destructive)] text-[var(--color-destructive-foreground)]',
  outline:
    'border border-[var(--color-border)] bg-transparent text-[var(--color-foreground)]',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-1 text-sm',
}

function Badge({ variant = 'default', size = 'sm', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full font-medium leading-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
      {...props}
    />
  )
}

export { Badge }
