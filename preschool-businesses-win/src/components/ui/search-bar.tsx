'use client'

import { forwardRef, useCallback, useEffect, useRef, useState, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface SearchBarProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Called with the debounced value */
  onSearch?: (value: string) => void
  /** Debounce delay in ms */
  debounce?: number
  /** Show keyboard shortcut hint */
  showShortcut?: boolean
  className?: string
}

const SearchBar = forwardRef<HTMLInputElement, SearchBarProps>(
  ({ onSearch, debounce = 300, showShortcut = true, className, ...props }, ref) => {
    const [value, setValue] = useState('')
    const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)
    const inputRef = useRef<HTMLInputElement | null>(null)

    const setRef = useCallback(
      (node: HTMLInputElement | null) => {
        inputRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    // Debounced search callback
    useEffect(() => {
      timerRef.current = setTimeout(() => {
        onSearch?.(value)
      }, debounce)
      return () => clearTimeout(timerRef.current)
    }, [value, debounce, onSearch])

    // Cmd+K / Ctrl+K shortcut
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
          e.preventDefault()
          inputRef.current?.focus()
        }
      }
      document.addEventListener('keydown', handler)
      return () => document.removeEventListener('keydown', handler)
    }, [])

    return (
      <div className={cn('relative', className)}>
        {/* Search icon */}
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={setRef}
          type="search"
          role="searchbox"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={cn(
            'h-12 w-full min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-20 text-base text-[var(--color-foreground)]',
            'placeholder:text-[var(--color-muted-foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
            'transition-colors',
          )}
          placeholder={props.placeholder ?? 'Search...'}
          {...props}
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={() => {
              setValue('')
              onSearch?.('')
              inputRef.current?.focus()
            }}
            className="absolute right-12 top-1/2 -translate-y-1/2 inline-flex h-6 w-6 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] focus:outline-none"
            aria-label="Clear search"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        {/* Shortcut hint */}
        {showShortcut && !value && (
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)] sm:inline-flex">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        )}
      </div>
    )
  },
)

SearchBar.displayName = 'SearchBar'

export { SearchBar }
