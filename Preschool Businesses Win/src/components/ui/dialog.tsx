'use client'

import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useRef,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export interface DialogContentProps extends HTMLAttributes<HTMLDivElement> {
  title: string
  description?: string
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

function Dialog({ open, onOpenChange, children }: DialogProps) {
  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onOpenChange])

  // Lock body scroll when open
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(<>{children}</>, document.body)
}

// ---------------------------------------------------------------------------
// Overlay
// ---------------------------------------------------------------------------

export interface DialogOverlayProps extends HTMLAttributes<HTMLDivElement> {}

const DialogOverlay = forwardRef<HTMLDivElement, DialogOverlayProps>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'fixed inset-0 z-50 bg-black/50 motion-safe:animate-[fadeIn_200ms_ease-out]',
        className,
      )}
      {...props}
    />
  ),
)
DialogOverlay.displayName = 'DialogOverlay'

// ---------------------------------------------------------------------------
// Content (with focus trap)
// ---------------------------------------------------------------------------

const DialogContent = forwardRef<HTMLDivElement, DialogContentProps>(
  ({ title, description, className, children, ...props }, ref) => {
    const titleId = useId()
    const descId = useId()
    const contentRef = useRef<HTMLDivElement | null>(null)

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        contentRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    // Basic focus trap
    useEffect(() => {
      const el = contentRef.current
      if (!el) return

      const focusable = el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      )
      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      first?.focus()

      const handler = (e: KeyboardEvent) => {
        if (e.key !== 'Tab') return
        if (focusable.length === 0) {
          e.preventDefault()
          return
        }
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last?.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first?.focus()
          }
        }
      }

      el.addEventListener('keydown', handler)
      return () => el.removeEventListener('keydown', handler)
    }, [])

    return (
      <div
        ref={setRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2',
          'rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-lg',
          'motion-safe:animate-[dialogIn_300ms_ease-out]',
          className,
        )}
        {...props}
      >
        <h2
          id={titleId}
          className="text-lg font-semibold text-[var(--color-foreground)]"
        >
          {title}
        </h2>
        {description && (
          <p id={descId} className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        )}
        <div className="mt-4">{children}</div>
      </div>
    )
  },
)
DialogContent.displayName = 'DialogContent'

// ---------------------------------------------------------------------------
// Close trigger helper
// ---------------------------------------------------------------------------

export interface DialogCloseProps extends HTMLAttributes<HTMLButtonElement> {}

const DialogClose = forwardRef<HTMLButtonElement, DialogCloseProps>(
  ({ className, children, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'absolute right-4 top-4 inline-flex h-8 w-8 min-h-[48px] min-w-[48px] items-center justify-center rounded-full',
        'text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]',
        'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
        'transition-colors',
        className,
      )}
      aria-label="Close dialog"
      {...props}
    >
      {children ?? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      )}
    </button>
  ),
)
DialogClose.displayName = 'DialogClose'

export { Dialog, DialogOverlay, DialogContent, DialogClose }
