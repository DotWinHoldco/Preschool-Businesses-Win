'use client'

import { useEffect, type ReactNode } from 'react'
import { create } from 'zustand'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ToastVariant = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  variant: ToastVariant
  title: string
  description?: string
  duration?: number
}

// ---------------------------------------------------------------------------
// Zustand store
// ---------------------------------------------------------------------------

interface ToastStore {
  toasts: Toast[]
  add: (toast: Omit<Toast, 'id'>) => string
  dismiss: (id: string) => void
  clear: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  add: (toast) => {
    const id = crypto.randomUUID()
    set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
    return id
  },
  dismiss: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}))

/** Convenience function for adding toasts without using the hook */
export const toast = (props: Omit<Toast, 'id'>) => useToastStore.getState().add(props)

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------

const icons: Record<ToastVariant, ReactNode> = {
  success: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  error: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-destructive)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  ),
  warning: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  ),
  info: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
}

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({ toast: t }: { toast: Toast }) {
  const dismiss = useToastStore((s) => s.dismiss)

  useEffect(() => {
    const dur = t.duration ?? 5000
    if (dur <= 0) return
    const timer = setTimeout(() => dismiss(t.id), dur)
    return () => clearTimeout(timer)
  }, [t.id, t.duration, dismiss])

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg',
        'motion-safe:animate-[slideInRight_300ms_ease-out]',
      )}
    >
      <span className="mt-0.5 shrink-0">{icons[t.variant]}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--color-foreground)]">{t.title}</p>
        {t.description && (
          <p className="mt-0.5 text-sm text-[var(--color-muted-foreground)]">{t.description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => dismiss(t.id)}
        className="shrink-0 inline-flex h-6 w-6 min-h-[48px] min-w-[48px] items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
        aria-label="Dismiss notification"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Toast container (render once in root layout)
// ---------------------------------------------------------------------------

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div
      aria-label="Notifications"
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col-reverse gap-2"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}

export { ToastContainer, ToastItem }
