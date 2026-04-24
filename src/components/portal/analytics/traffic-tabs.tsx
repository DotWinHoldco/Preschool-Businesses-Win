import Link from 'next/link'
import { cn } from '@/lib/cn'

interface TrafficTabsProps {
  active: 'overview' | 'install'
}

const tabs: { value: TrafficTabsProps['active']; label: string; href: string }[] = [
  { value: 'overview', label: 'Overview', href: '/portal/admin/analytics/traffic' },
  {
    value: 'install',
    label: 'Install & Integrations',
    href: '/portal/admin/analytics/traffic/install',
  },
]

export function TrafficTabs({ active }: TrafficTabsProps) {
  return (
    <div role="tablist" className="flex border-b border-[var(--color-border)] -mt-2">
      {tabs.map((t) => {
        const isActive = t.value === active
        return (
          <Link
            key={t.value}
            href={t.href}
            role="tab"
            aria-selected={isActive}
            className={cn(
              'relative px-4 py-3 text-sm font-medium min-h-[48px] flex items-center transition-colors',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-inset',
              isActive
                ? 'text-[var(--color-primary)]'
                : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]',
            )}
          >
            {t.label}
            {isActive && (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-primary)]"
                aria-hidden="true"
              />
            )}
          </Link>
        )
      })}
    </div>
  )
}
