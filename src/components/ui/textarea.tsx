'use client'

import { forwardRef, useCallback, useEffect, useRef, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean
  autoResize?: boolean
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ error = false, autoResize = false, className, onChange, ...props }, ref) => {
    const internalRef = useRef<HTMLTextAreaElement | null>(null)

    const setRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const resize = useCallback(() => {
      const el = internalRef.current
      if (!el || !autoResize) return
      el.style.height = 'auto'
      el.style.height = `${el.scrollHeight}px`
    }, [autoResize])

    useEffect(() => {
      resize()
    }, [resize, props.value, props.defaultValue])

    return (
      <textarea
        ref={setRef}
        className={cn(
          'w-full rounded-[var(--radius,0.75rem)] border bg-[var(--color-background)] text-[var(--color-foreground)]',
          'placeholder:text-[var(--color-muted-foreground)]',
          'transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'min-h-[120px] px-4 py-3 text-base',
          autoResize && 'resize-none overflow-hidden',
          error
            ? 'border-[var(--color-destructive)] focus:ring-[var(--color-destructive)]'
            : 'border-[var(--color-border)] focus:ring-[var(--color-ring,#2563eb)]',
          className,
        )}
        aria-invalid={error || undefined}
        onChange={(e) => {
          onChange?.(e)
          resize()
        }}
        {...props}
      />
    )
  },
)

Textarea.displayName = 'Textarea'

export { Textarea }
