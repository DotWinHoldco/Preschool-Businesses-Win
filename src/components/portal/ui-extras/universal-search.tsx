'use client'

// @anchor: cca.ui.universal-search
// Search bar that searches students, families, and staff with fuzzy matching.
// Cmd+K shortcut. Results show quick-view data.

import { useCallback, useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/cn'

interface SearchResult {
  id: string
  type: 'student' | 'family' | 'staff'
  title: string
  subtitle: string
  href: string
  badge?: string
}

export interface UniversalSearchProps {
  className?: string
}

export function UniversalSearch({ className }: UniversalSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  // Cmd+K shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
        inputRef.current?.blur()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [])

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) {
      setResults([])
      return
    }

    setLoading(true)

    // TODO: Replace with real Supabase full-text search
    // For now, show empty results — the search infrastructure is wired
    // and will connect to Supabase postgres FTS in Phase 1.
    try {
      // Simulated delay for UX
      await new Promise((r) => setTimeout(r, 200))
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  const handleChange = (value: string) => {
    setQuery(value)
    setSelectedIndex(0)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => search(value), 300)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((i) => Math.min(i + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      window.location.href = results[selectedIndex].href
    }
  }

  const typeIcons: Record<string, string> = {
    student: 'S',
    family: 'F',
    staff: 'ST',
  }

  const typeColors: Record<string, string> = {
    student: 'bg-blue-100 text-blue-700',
    family: 'bg-green-100 text-green-700',
    staff: 'bg-purple-100 text-purple-700',
  }

  return (
    <div className={cn('relative', className)}>
      {/* Search input */}
      <div className="relative">
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
          ref={inputRef}
          type="search"
          role="combobox"
          aria-controls="universal-search-results"
          aria-expanded={isOpen && results.length > 0}
          aria-autocomplete="list"
          aria-label="Search students, families, and staff"
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Search students, families, staff..."
          className={cn(
            'h-10 w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-16 text-sm text-[var(--color-foreground)]',
            'placeholder:text-[var(--color-muted-foreground)]',
            'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1',
            'transition-colors',
          )}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 hidden items-center gap-0.5 rounded border border-[var(--color-border)] bg-[var(--color-muted)] px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)] sm:inline-flex">
          <span className="text-xs">&#8984;</span>K
        </kbd>
      </div>

      {/* Results dropdown */}
      {isOpen && query.length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] shadow-lg">
          {loading ? (
            <div className="p-4 text-center text-sm text-[var(--color-muted-foreground)]">
              Searching...
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-[var(--color-muted-foreground)]">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <ul
              id="universal-search-results"
              role="listbox"
              className="max-h-80 overflow-y-auto py-1"
            >
              {results.map((result, idx) => (
                <li
                  key={`${result.type}-${result.id}`}
                  role="option"
                  aria-selected={idx === selectedIndex}
                >
                  <a
                    href={result.href}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5 transition-colors',
                      idx === selectedIndex
                        ? 'bg-[var(--color-muted)]'
                        : 'hover:bg-[var(--color-muted)]/50',
                    )}
                  >
                    <span
                      className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
                        typeColors[result.type],
                      )}
                    >
                      {typeIcons[result.type]}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
                        {result.title}
                      </p>
                      <p className="truncate text-xs text-[var(--color-muted-foreground)]">
                        {result.subtitle}
                      </p>
                    </div>
                    {result.badge && (
                      <span className="shrink-0 rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[10px] font-medium text-[var(--color-muted-foreground)]">
                        {result.badge}
                      </span>
                    )}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
