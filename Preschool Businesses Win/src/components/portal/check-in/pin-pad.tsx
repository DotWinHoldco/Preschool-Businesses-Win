'use client'

// @anchor: cca.checkin.pin-pad
// 6-digit PIN entry pad with large touch targets.
// Auto-submits on 6th digit.
// See CCA_BUILD_BRIEF.md §7

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import { Delete, X } from 'lucide-react'

interface PinPadProps {
  onSubmit: (pin: string) => void
  loading?: boolean
  error?: string | null
  className?: string
}

export function PinPad({ onSubmit, loading = false, error, className }: PinPadProps) {
  const [digits, setDigits] = useState<string>('')

  const handleDigit = useCallback(
    (digit: string) => {
      if (loading) return
      const next = digits + digit
      if (next.length > 6) return
      setDigits(next)
      if (next.length === 6) {
        onSubmit(next)
      }
    },
    [digits, loading, onSubmit],
  )

  const handleBackspace = useCallback(() => {
    if (loading) return
    setDigits((d) => d.slice(0, -1))
  }, [loading])

  const handleClear = useCallback(() => {
    if (loading) return
    setDigits('')
  }, [loading])

  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9']

  return (
    <div className={cn('flex flex-col items-center gap-6', className)}>
      {/* PIN display dots */}
      <div className="flex items-center gap-3" aria-label={`PIN entered: ${digits.length} of 6 digits`}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 w-4 rounded-full border-2 transition-colors',
              i < digits.length
                ? 'border-[var(--color-primary)] bg-[var(--color-primary)]'
                : 'border-[var(--color-border)] bg-transparent',
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm font-medium text-[var(--color-destructive)]" role="alert">
          {error}
        </p>
      )}

      {/* Keypad */}
      <div className="grid grid-cols-3 gap-3">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => handleDigit(key)}
            disabled={loading || digits.length >= 6}
            className={cn(
              'flex h-16 w-16 items-center justify-center rounded-full',
              'text-2xl font-semibold',
              'bg-[var(--color-muted)] text-[var(--color-foreground)]',
              'transition-colors active:bg-[var(--color-primary)] active:text-[var(--color-primary-foreground)]',
              'hover:bg-[var(--color-border)]',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'select-none',
              'min-h-[48px] min-w-[48px]',
            )}
            aria-label={`Digit ${key}`}
          >
            {key}
          </button>
        ))}

        {/* Bottom row: Clear, 0, Backspace */}
        <button
          type="button"
          onClick={handleClear}
          disabled={loading || digits.length === 0}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            'text-sm font-medium',
            'bg-transparent text-[var(--color-muted-foreground)]',
            'transition-colors hover:bg-[var(--color-muted)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'min-h-[48px] min-w-[48px]',
          )}
          aria-label="Clear all digits"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => handleDigit('0')}
          disabled={loading || digits.length >= 6}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            'text-2xl font-semibold',
            'bg-[var(--color-muted)] text-[var(--color-foreground)]',
            'transition-colors active:bg-[var(--color-primary)] active:text-[var(--color-primary-foreground)]',
            'hover:bg-[var(--color-border)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'select-none',
            'min-h-[48px] min-w-[48px]',
          )}
          aria-label="Digit 0"
        >
          0
        </button>

        <button
          type="button"
          onClick={handleBackspace}
          disabled={loading || digits.length === 0}
          className={cn(
            'flex h-16 w-16 items-center justify-center rounded-full',
            'text-sm font-medium',
            'bg-transparent text-[var(--color-muted-foreground)]',
            'transition-colors hover:bg-[var(--color-muted)]',
            'disabled:opacity-40 disabled:cursor-not-allowed',
            'min-h-[48px] min-w-[48px]',
          )}
          aria-label="Delete last digit"
        >
          <Delete className="h-5 w-5" />
        </button>
      </div>

      {loading && (
        <p className="text-sm text-[var(--color-muted-foreground)]" aria-live="polite">
          Verifying PIN...
        </p>
      )}
    </div>
  )
}
