'use client'

import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: ReactNode
  error?: boolean
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, error = false, className, id: idProp, ...props }, ref) => {
    const generatedId = useId()
    const id = idProp ?? generatedId

    return (
      <div className={cn('relative flex items-start gap-3', className)}>
        {/* The visual checkbox is 20px, but the touch target is 48px via the wrapping label */}
        <div className="relative flex h-5 w-5 shrink-0 items-center justify-center mt-0.5">
          <input
            ref={ref}
            type="checkbox"
            id={id}
            className={cn(
              'peer h-5 w-5 shrink-0 cursor-pointer appearance-none rounded-[4px] border',
              'relative grid place-content-center',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-offset-1',
              'disabled:cursor-not-allowed disabled:opacity-50',
              'checked:bg-[var(--color-primary)] checked:border-[var(--color-primary)]',
              "checked:after:content-[''] checked:after:absolute checked:after:inset-0 checked:after:m-auto",
              'checked:after:h-2.5 checked:after:w-1.5 checked:after:rotate-45 checked:after:border-b-2 checked:after:border-r-2 checked:after:border-[var(--color-primary-foreground)]',
              error
                ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]'
                : 'border-[var(--color-border)] focus:ring-[var(--color-primary)]',
            )}
            aria-invalid={error || undefined}
            {...props}
          />
          {/* 48px touch target overlay for the checkbox */}
          <label
            htmlFor={id}
            className="absolute -inset-3 cursor-pointer"
            aria-hidden="true"
          />
        </div>
        {label && (
          <label
            htmlFor={id}
            className="cursor-pointer text-base text-[var(--color-foreground)] select-none leading-snug peer-disabled:cursor-not-allowed peer-disabled:opacity-50"
          >
            {label}
          </label>
        )}
      </div>
    )
  },
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
