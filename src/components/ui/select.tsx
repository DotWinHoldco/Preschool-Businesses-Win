import { forwardRef, type SelectHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ error = false, className, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'w-full appearance-none rounded-[var(--radius,0.75rem)] border bg-[var(--color-background)] text-[var(--color-foreground)]',
          'h-12 min-h-[48px] px-4 pr-10 text-base',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'bg-[length:16px_16px] bg-[right_12px_center] bg-no-repeat',
          "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
          error
            ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]',
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      >
        {children}
      </select>
    )
  },
)

Select.displayName = 'Select'

export { Select }
