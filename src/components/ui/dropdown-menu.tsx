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
import { createPortal } from 'react-dom'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface DropdownCtx {
  open: boolean
  toggle: () => void
  close: () => void
  triggerRef: React.MutableRefObject<HTMLButtonElement | null>
}

const Ctx = createContext<DropdownCtx>({
  open: false,
  toggle: () => {},
  close: () => {},
  triggerRef: { current: null },
})

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
  const triggerRef = useRef<HTMLButtonElement | null>(null)

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
    <Ctx.Provider value={{ open, toggle, close, triggerRef }}>
      <span className="relative inline-block">{children}</span>
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

export type DropdownMenuTriggerProps = ButtonHTMLAttributes<HTMLButtonElement>

const DropdownMenuTrigger = forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, ...props }, ref) => {
    const { open, toggle, triggerRef } = useContext(Ctx)
    const setRef = useCallback(
      (node: HTMLButtonElement | null) => {
        triggerRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref, triggerRef],
    )
    return (
      <button
        ref={setRef}
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
    const { open, close, triggerRef } = useContext(Ctx)
    const menuRef = useRef<HTMLDivElement | null>(null)
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
      setMounted(true)
    }, [])

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        menuRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    // Position the menu relative to the trigger using fixed coordinates so
    // overflow:hidden ancestors can never clip it.
    useEffect(() => {
      if (!open) return
      const measure = () => {
        const trigger = triggerRef.current
        const menu = menuRef.current
        if (!trigger) return
        const tRect = trigger.getBoundingClientRect()
        const menuW = menu?.offsetWidth ?? 180
        const menuH = menu?.offsetHeight ?? 0
        const gutter = 8

        let left = align === 'end' ? tRect.right - menuW : tRect.left
        // Keep horizontally inside the viewport.
        left = Math.max(gutter, Math.min(left, window.innerWidth - menuW - gutter))

        let top = tRect.bottom + 4
        // Flip above the trigger if there's no room below.
        if (menuH > 0 && top + menuH > window.innerHeight - gutter) {
          const above = tRect.top - 4 - menuH
          if (above >= gutter) top = above
        }
        setPos({ top, left })
      }
      measure()
      // Re-measure on next frame in case menu just rendered (for height-based flip).
      const raf = requestAnimationFrame(measure)
      window.addEventListener('resize', measure)
      window.addEventListener('scroll', measure, true)
      return () => {
        cancelAnimationFrame(raf)
        window.removeEventListener('resize', measure)
        window.removeEventListener('scroll', measure, true)
      }
    }, [open, align, triggerRef])

    // Click outside (counts trigger as inside).
    useEffect(() => {
      if (!open) return
      const handler = (e: MouseEvent) => {
        const target = e.target as Node
        if (menuRef.current?.contains(target)) return
        if (triggerRef.current?.contains(target)) return
        close()
      }
      document.addEventListener('mousedown', handler)
      return () => document.removeEventListener('mousedown', handler)
    }, [open, close, triggerRef])

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
      const first = items()[0]
      first?.focus()

      return () => el.removeEventListener('keydown', handler)
    }, [open])

    if (!open || !mounted) return null

    const node = (
      <div
        ref={setRef}
        role="menu"
        aria-orientation="vertical"
        style={{
          position: 'fixed',
          top: pos?.top ?? -9999,
          left: pos?.left ?? -9999,
          visibility: pos ? 'visible' : 'hidden',
        }}
        className={cn(
          'z-[1000] min-w-[180px] overflow-hidden rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg',
          'motion-safe:animate-[fadeIn_150ms_ease-out]',
          className,
        )}
        {...props}
      >
        {children}
      </div>
    )

    return createPortal(node, document.body)
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
