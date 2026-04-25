'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS: { href: string; label: string; matches: (p: string) => boolean }[] = [
  {
    href: '/portal/admin/crm/contacts',
    label: 'Contacts',
    matches: (p) => p.startsWith('/portal/admin/crm/contacts'),
  },
  {
    href: '/portal/admin/crm/audiences',
    label: 'Audiences',
    matches: (p) =>
      p.startsWith('/portal/admin/crm/audiences') || p.startsWith('/portal/admin/crm/pipelines'),
  },
  {
    href: '/portal/admin/crm/templates',
    label: 'Templates',
    matches: (p) => p.startsWith('/portal/admin/crm/templates'),
  },
  {
    href: '/portal/admin/crm/campaigns',
    label: 'Campaigns',
    matches: (p) => p.startsWith('/portal/admin/crm/campaigns'),
  },
  {
    href: '/portal/admin/crm/automations',
    label: 'Automations',
    matches: (p) => p.startsWith('/portal/admin/crm/automations'),
  },
  {
    href: '/portal/admin/crm/settings',
    label: 'Settings',
    matches: (p) => p.startsWith('/portal/admin/crm/settings'),
  },
]

export function CRMTabs() {
  const pathname = usePathname() ?? ''
  return (
    <nav className="flex gap-1 border-b border-[var(--color-border)] overflow-x-auto -mx-4 px-4">
      {TABS.map((t) => {
        const active = t.matches(pathname)
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`relative px-4 py-3 text-sm font-medium whitespace-nowrap min-h-[44px] flex items-center transition-colors ${active ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'}`}
          >
            {t.label}
            {active && (
              <span className="absolute inset-x-0 -bottom-px h-0.5 bg-[var(--color-primary)]" />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
