'use client'

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useRef,
  useState,
  type HTMLAttributes,
} from 'react'
import { cn } from '@/lib/cn'

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AccordionCtx {
  openItems: Set<string>
  toggle: (id: string) => void
}

const Ctx = createContext<AccordionCtx>({ openItems: new Set(), toggle: () => {} })

// ---------------------------------------------------------------------------
// Accordion root
// ---------------------------------------------------------------------------

export interface AccordionProps extends HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple'
  defaultValue?: string[]
}

function Accordion({
  type = 'single',
  defaultValue = [],
  className,
  children,
  ...props
}: AccordionProps) {
  const [openItems, setOpenItems] = useState<Set<string>>(new Set(defaultValue))

  const toggle = useCallback(
    (id: string) => {
      setOpenItems((prev) => {
        const next = new Set(prev)
        if (next.has(id)) {
          next.delete(id)
        } else {
          if (type === 'single') next.clear()
          next.add(id)
        }
        return next
      })
    },
    [type],
  )

  return (
    <Ctx.Provider value={{ openItems, toggle }}>
      <div className={cn('divide-y divide-[var(--color-border)]', className)} {...props}>
        {children}
      </div>
    </Ctx.Provider>
  )
}

// ---------------------------------------------------------------------------
// AccordionItem
// ---------------------------------------------------------------------------

export interface AccordionItemProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    return (
      <div ref={ref} data-accordion-value={value} className={className} {...props}>
        {children}
      </div>
    )
  },
)
AccordionItem.displayName = 'AccordionItem'

// ---------------------------------------------------------------------------
// AccordionTrigger
// ---------------------------------------------------------------------------

export interface AccordionTriggerProps extends HTMLAttributes<HTMLButtonElement> {
  value: string
}

const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItems, toggle } = useContext(Ctx)
    const isOpen = openItems.has(value)
    const contentId = `accordion-content-${value}`
    const triggerId = `accordion-trigger-${value}`

    return (
      <h3>
        <button
          ref={ref}
          type="button"
          id={triggerId}
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => toggle(value)}
          className={cn(
            'flex w-full items-center justify-between py-4 text-left text-base font-medium min-h-[48px]',
            'text-[var(--color-foreground)] transition-colors',
            'hover:text-[var(--color-primary)]',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset rounded-sm',
            className,
          )}
          {...props}
        >
          {children}
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('shrink-0 transition-transform duration-200', isOpen && 'rotate-180')}
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </h3>
    )
  },
)
AccordionTrigger.displayName = 'AccordionTrigger'

// ---------------------------------------------------------------------------
// AccordionContent
// ---------------------------------------------------------------------------

export interface AccordionContentProps extends HTMLAttributes<HTMLDivElement> {
  value: string
}

const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ value, className, children, ...props }, ref) => {
    const { openItems } = useContext(Ctx)
    const isOpen = openItems.has(value)
    const contentId = `accordion-content-${value}`
    const triggerId = `accordion-trigger-${value}`
    const innerRef = useRef<HTMLDivElement>(null)

    return (
      <div
        ref={ref}
        id={contentId}
        role="region"
        aria-labelledby={triggerId}
        className={cn(
          'overflow-hidden transition-[max-height,opacity] duration-300 ease-out',
          isOpen ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0',
        )}
        {...props}
      >
        <div
          ref={innerRef}
          className={cn('pb-4 text-sm text-[var(--color-muted-foreground)]', className)}
        >
          {children}
        </div>
      </div>
    )
  },
)
AccordionContent.displayName = 'AccordionContent'

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
