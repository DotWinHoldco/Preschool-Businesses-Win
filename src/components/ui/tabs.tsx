'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useRef,
  useState,
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface TabsCtx {
  activeTab: string
  setActiveTab: (id: string) => void
  baseId: string
}

const Ctx = createContext<TabsCtx>({ activeTab: '', setActiveTab: () => {}, baseId: '' })

// ---------------------------------------------------------------------------
// Tabs root
// ---------------------------------------------------------------------------

export interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

function Tabs({ defaultValue, value, onValueChange, children, className }: TabsProps) {
  const [internal, setInternal] = useState(defaultValue)
  const baseId = useId()

  const activeTab = value ?? internal
  const setActiveTab = useCallback(
    (id: string) => {
      if (!value) setInternal(id)
      onValueChange?.(id)
    },
    [value, onValueChange],
  )

  return (
    <Ctx.Provider value={{ activeTab, setActiveTab, baseId }}>
      <div className={className}>{children}</div>
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// TabList
// ---------------------------------------------------------------------------

export type TabListProps = HTMLAttributes<HTMLDivElement>

const TabList = forwardRef<HTMLDivElement, TabListProps>(
  ({ className, children, ...props }, ref) => {
    const listRef = useRef<HTMLDivElement | null>(null)

    const setRef = useCallback(
      (node: HTMLDivElement | null) => {
        listRef.current = node
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      },
      [ref],
    )

    const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
      const el = listRef.current
      if (!el) return
      const tabs = Array.from(el.querySelectorAll<HTMLElement>('[role="tab"]:not([disabled])'))
      const idx = tabs.indexOf(document.activeElement as HTMLElement)

      let nextIdx = idx
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        nextIdx = (idx + 1) % tabs.length
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        nextIdx = (idx - 1 + tabs.length) % tabs.length
      } else if (e.key === 'Home') {
        e.preventDefault()
        nextIdx = 0
      } else if (e.key === 'End') {
        e.preventDefault()
        nextIdx = tabs.length - 1
      }

      if (nextIdx !== idx) {
        tabs[nextIdx]?.focus()
        tabs[nextIdx]?.click()
      }
    }

    return (
      <div
        ref={setRef}
        role="tablist"
        className={cn('flex border-b border-[var(--color-border)]', className)}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </div>
    )
  },
)
TabList.displayName = 'TabList'

// ---------------------------------------------------------------------------
// Tab
// ---------------------------------------------------------------------------

export interface TabProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
  disabled?: boolean
}

const Tab = forwardRef<HTMLButtonElement, TabProps>(
  ({ value, disabled = false, className, children, ...props }, ref) => {
    const { activeTab, setActiveTab, baseId } = useContext(Ctx)
    const isActive = activeTab === value

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-controls={`${baseId}-panel-${value}`}
        aria-selected={isActive}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        onClick={() => setActiveTab(value)}
        className={cn(
          'relative px-4 py-3 text-sm font-medium min-h-[48px] transition-colors',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset',
          'disabled:pointer-events-none disabled:opacity-50',
          isActive
            ? 'text-[var(--color-primary)]'
            : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
          className,
        )}
        {...props}
      >
        {children}
        {isActive && (
          <span
            className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-primary)]"
            aria-hidden="true"
          />
        )}
      </button>
    )
  },
)
Tab.displayName = 'Tab'

// ---------------------------------------------------------------------------
// TabPanel
// ---------------------------------------------------------------------------

export interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ value, className, children, ...props }, ref) => {
    const { activeTab, baseId } = useContext(Ctx)
    const isActive = activeTab === value

    if (!isActive) return null

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={`${baseId}-panel-${value}`}
        aria-labelledby={`${baseId}-tab-${value}`}
        tabIndex={0}
        className={cn('mt-4 focus:outline-none', className)}
        {...props}
      >
        {children}
      </div>
    )
  },
)
TabPanel.displayName = 'TabPanel'

export { Tabs, TabList, Tab, TabPanel }
