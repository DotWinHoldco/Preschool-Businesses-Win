import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  inputSize?: InputSize
  error?: boolean
}

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-12 px-4 text-base',
  lg: 'h-14 px-5 text-lg',
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ inputSize = 'md', error = false, className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'w-full rounded-[var(--radius,0.75rem)] border bg-[var(--color-background)] text-[var(--color-foreground)]',
          'placeholder:text-[var(--color-muted-foreground)]',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[48px]',
          error
            ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]'
            : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]',
          sizeClasses[inputSize],
          className,
        )}
        aria-invalid={error || undefined}
        {...props}
      />
    )
  },
)

Input.displayName = 'Input'

export { Input }
