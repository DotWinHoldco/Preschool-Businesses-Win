'use client'

// @anchor: cca.auth.role-switcher
// Role switcher component for dual-role users (e.g., staff who are also parents).
// Dropdown to switch between available roles.

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, Shield, User, Users } from 'lucide-react'
import { cn } from '@/lib/cn'

interface RoleOption {
  role: string
  label: string
  description: string
  href: string
}

interface RoleSwitcherProps {
  currentRole: string
  availableRoles: RoleOption[]
  className?: string
}

const ROLE_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  cca_owner: Shield,
  cca_admin: Shield,
  lead_teacher: Users,
  teacher: Users,
  aide: Users,
  parent: User,
  guardian: User,
  default: User,
}

export function RoleSwitcher({
  currentRole,
  availableRoles,
  className,
}: RoleSwitcherProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Don't render if only one role
  if (availableRoles.length <= 1) return null

  const currentOption = availableRoles.find((r) => r.role === currentRole)
  const Icon = ROLE_ICONS[currentRole] ?? ROLE_ICONS.default

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors hover:bg-[var(--color-muted)]"
        style={{ color: 'var(--color-foreground)' }}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <Icon size={16} />
        <span>{currentOption?.label ?? currentRole}</span>
        <ChevronDown
          size={14}
          className={cn('transition-transform', open && 'rotate-180')}
          style={{ color: 'var(--color-muted-foreground)' }}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-56 rounded-[var(--radius)] border p-1 shadow-lg"
          style={{
            backgroundColor: 'var(--color-card)',
            borderColor: 'var(--color-border)',
          }}
          role="listbox"
          aria-label="Switch role"
        >
          {availableRoles.map((option) => {
            const OptionIcon = ROLE_ICONS[option.role] ?? ROLE_ICONS.default
            const isActive = option.role === currentRole

            return (
              <button
                key={option.role}
                type="button"
                role="option"
                aria-selected={isActive}
                onClick={() => {
                  setOpen(false)
                  router.push(option.href)
                }}
                className={cn(
                  'flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
                  isActive
                    ? 'bg-[var(--color-primary)]/10'
                    : 'hover:bg-[var(--color-muted)]'
                )}
              >
                <OptionIcon size={16} />
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: isActive
                        ? 'var(--color-primary)'
                        : 'var(--color-foreground)',
                    }}
                  >
                    {option.label}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {option.description}
                  </p>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
