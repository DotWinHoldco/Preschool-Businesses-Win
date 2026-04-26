'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownCtx {
  open: boolean
  toggle: () => void
  close: () => void
}

const Ctx = createContext<DropdownCtx>({ open: false, toggle: () => {}, close: () => {} })

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export interface DropdownMenuProps {
  children: ReactNode
}

function DropdownMenu({ children }: DropdownMenuProps) {
  const [open, setOpen] = useState(false)
  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])
  const rootRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open, close])

  // Close on escape
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, close])

  return (
    <Ctx.Provider value={{ open, toggle, close }}>
      <div ref={rootRef} className="relative inline-block">
        {children}
      </div>
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, ...props }, ref) => {
    const { open, toggle } = useContext(Ctx)
    return (
      <button
        ref={ref}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className={cn(
          'inline-flex items-center justify-center min-h-[48px] min-w-[48px]',
          'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1 rounded-[var(--radius,0.75rem)]',
          className,
        )}
        {...props}
      />
    )
  },
)
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger'

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

export interface DropdownMenuContentProps extends HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'end'
}

const DropdownMenuContent = forwardRef<HTMLDivElement, DropdownMenuContentProps>(
  ({ align = 'end', className, children, ...props }, ref) => {
    const { open, close: _close } = useContext(Ctx)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [shiftLeft, setShiftLeft] = useState(0)

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        menuRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    // Keep the menu inside the viewport — nudge left if it would overflow the right edge.
    useEffect(() => {
      const el = menuRef.current
      if (!open || !el) {
        setShiftLeft(0)
        return
      }
      const measure = () => {
        const rect = el.getBoundingClientRect()
        const overflow = rect.right - window.innerWidth + 8 // 8px gutter
        setShiftLeft(overflow > 0 ? overflow : 0)
      }
      measure()
      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure, true)
      return () => {
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure, true)
      }
    }, [open])

    // Keyboard navigation
    useEffect(() => {
      const el = menuRef.current
      if (!open || !el) return

      const items = () => el.querySelectorAll<HTMLElement>('[role="menuitem"]:not([disabled])')

      const handler = (e: KeyboardEvent) => {
        const list = Array.from(items())
        const idx = list.indexOf(document.activeElement as HTMLElement)

        if (e.key === 'ArrowDown') {
          e.preventDefault()
          list[(idx + 1) % list.length]?.focus()
        } else if (e.key === 'ArrowUp') {
          e.preventDefault()
          list[(idx - 1 + list.length) % list.length]?.focus()
        } else if (e.key === 'Home') {
          e.preventDefault()
          list[0]?.focus()
        } else if (e.key === 'End') {
          e.preventDefault()
          list[list.length - 1]?.focus()
        }
      }

      el.addEventListener('keydown', handler)
      // Focus first item on open
      const first = items()[0]
      first?.focus()

      return () => el.removeEventListener('keydown', handler)
    }, [open])

    if (!open) return null

    return (
      <div
        ref={setRef}
        role="menu"
        aria-orientation="vertical"
        style={shiftLeft > 0 ? { transform: `translateX(-${shiftLeft}px)` } : undefined}
        className={cn(
          'absolute z-50 mt-1 min-w-[180px] overflow-hidden rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg',
          'motion-safe:animate-[fadeIn_150ms_ease-out]',
          align === 'end' ? 'right-0' : 'left-0',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )
  },
)
DropdownMenuContent.displayName = 'DropdownMenuContent'

// ---------------------------------------------------------------------------
// Item
// ---------------------------------------------------------------------------

export interface DropdownMenuItemProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean
}

const DropdownMenuItem = forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ destructive = false, className, ...props }, ref) => {
    const { close } = useContext(Ctx)

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        tabIndex={-1}
        className={cn(
          'flex w-full items-center gap-2 rounded-[calc(var(--radius,0.75rem)-4px)] px-3 py-2 text-sm min-h-[44px]',
          'transition-colors cursor-pointer',
          'focus:outline-none focus:bg-[var(--color-muted)]',
          destructive
            ? 'text-[var(--color-destructive)] hover:bg-[var(--color-destructive)]/10'
            : 'text-[var(--color-foreground)] hover:bg-[var(--color-muted)]',
          'disabled:pointer-events-none disabled:opacity-50',
          className,
        )}
        onClick={(e) => {
          props.onClick?.(e)
          close()
        }}
        {...props}
      />
    )
  },
)
DropdownMenuItem.displayName = 'DropdownMenuItem'

// ---------------------------------------------------------------------------
// Separator
// ---------------------------------------------------------------------------

function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div role="separator" className={cn('my-1 h-px bg-[var(--color-border)]', className)} />
}

// ---------------------------------------------------------------------------
// Label
// ---------------------------------------------------------------------------

function DropdownMenuLabel({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]',
        className,
      )}
      {...props}
    />
  )
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
}
