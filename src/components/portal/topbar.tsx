'use client'

// @anchor: portal.topbar
// Portal top bar — search, notifications, user avatar/menu, classroom switcher.
// See CCA_BUILD_BRIEF.md §4.2 for classroom switcher behavior.

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { Search, Bell, ChevronDown, Menu } from 'lucide-react'
import { cn } from '@/lib/cn'
import { getSupabaseBrowserClient } from '@/lib/supabase/browser'

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

interface Classroom {
  id: string
  name: string
}

interface UserInfo {
  name: string
  email: string
  avatarUrl?: string | null
  role: string
}

interface TopbarProps {
  /** Current user info for the avatar/menu */
  user: UserInfo
  /** Available classrooms for the switcher (staff only) */
  classrooms?: Classroom[]
  /** Currently selected classroom */
  activeClassroomId?: string | null
  /** Callback when classroom is changed */
  onClassroomChange?: (classroomId: string) => void
  /** Unread notification count */
  notificationCount?: number
  /** Callback to toggle mobile sidebar */
  onMobileMenuToggle?: () => void
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export function PortalTopbar({
  user,
  classrooms = [],
  activeClassroomId,
  onClassroomChange,
  notificationCount = 0,
  onMobileMenuToggle,
}: TopbarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const router = useRouter()

  async function handleSignOut() {
    const supabase = getSupabaseBrowserClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  /** Get the user's initials for the avatar fallback. */
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map((word) => word.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase()
  }

  return (
    <header
      className="flex items-center justify-between h-16 px-4 md:px-6 border-b shrink-0"
      style={{
        backgroundColor: 'var(--color-card)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Left side — mobile menu + search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Mobile sidebar toggle */}
        {onMobileMenuToggle && (
          <button
            type="button"
            onClick={onMobileMenuToggle}
            className="md:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-[var(--color-muted)]"
            style={{ color: 'var(--color-muted-foreground)' }}
            aria-label="Toggle sidebar"
          >
            <Menu size={20} />
          </button>
        )}

        {/* Search input */}
        <div className="relative hidden sm:flex items-center max-w-md flex-1">
          <Search
            size={16}
            className="absolute left-3 pointer-events-none"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <input
            type="search"
            placeholder="Search students, families, classrooms..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && searchQuery.trim()) {
                router.push(`/portal/admin/search?q=${encodeURIComponent(searchQuery.trim())}`)
              }
            }}
            className={cn(
              'w-full pl-9 pr-4 py-2 text-sm rounded-lg border',
              'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30',
              'placeholder:text-[var(--color-muted-foreground)]',
            )}
            style={{
              backgroundColor: 'var(--color-muted)',
              borderColor: 'var(--color-border)',
              color: 'var(--color-foreground)',
            }}
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right side — classroom switcher, notifications, user menu */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Classroom switcher (staff/admin only — rendered when classrooms are provided) */}
        {classrooms.length > 0 && (
          <div className="hidden md:block">
            <select
              value={activeClassroomId ?? ''}
              onChange={(e) => onClassroomChange?.(e.target.value)}
              className={cn(
                'text-sm font-medium px-3 py-1.5 rounded-lg border',
                'focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30',
              )}
              style={{
                backgroundColor: 'var(--color-muted)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-foreground)',
              }}
              aria-label="Switch classroom"
            >
              <option value="">All classrooms</option>
              {classrooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Notification bell */}
        <Link
          href="/portal/admin/notifications"
          className="relative p-2 rounded-lg transition-colors hover:bg-[var(--color-muted)]"
          style={{ color: 'var(--color-muted-foreground)' }}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
        >
          <Bell size={20} />
          {notificationCount > 0 && (
            <span
              className="absolute top-1 right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full"
              style={{
                backgroundColor: 'var(--color-destructive)',
                color: '#FFFFFF',
              }}
              aria-hidden="true"
            >
              {notificationCount > 99 ? '99+' : notificationCount}
            </span>
          )}
        </Link>

        {/* User avatar / menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg transition-colors hover:bg-[var(--color-muted)]"
            aria-expanded={userMenuOpen}
            aria-haspopup="true"
            aria-label="User menu"
          >
            {/* Avatar */}
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex items-center justify-center h-8 w-8 rounded-full text-xs font-bold"
                style={{
                  backgroundColor: 'var(--color-primary)',
                  color: 'var(--color-primary-foreground)',
                }}
              >
                {getInitials(user.name)}
              </div>
            )}

            {/* Name + role (hidden on small screens) */}
            <div className="hidden lg:flex flex-col items-start text-left">
              <span
                className="text-sm font-medium leading-tight"
                style={{ color: 'var(--color-foreground)' }}
              >
                {user.name}
              </span>
              <span
                className="text-xs leading-tight capitalize"
                style={{ color: 'var(--color-muted-foreground)' }}
              >
                {user.role.replace(/_/g, ' ')}
              </span>
            </div>

            <ChevronDown
              size={14}
              className="hidden lg:block"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
          </button>

          {/* Dropdown menu (placeholder — will be replaced with proper dropdown) */}
          {userMenuOpen && (
            <div
              className="absolute right-0 top-full mt-1 w-56 rounded-lg border shadow-lg py-1 z-50"
              style={{
                backgroundColor: 'var(--color-card)',
                borderColor: 'var(--color-border)',
              }}
              role="menu"
            >
              <div
                className="px-3 py-2 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {user.name}
                </p>
                <p
                  className="text-xs"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {user.email}
                </p>
              </div>
              <Link
                href="/portal/admin/profile"
                onClick={() => setUserMenuOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]"
                style={{ color: 'var(--color-foreground)' }}
                role="menuitem"
              >
                My profile
              </Link>
              <Link
                href="/portal/admin/notification-preferences"
                onClick={() => setUserMenuOpen(false)}
                className="block w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]"
                style={{ color: 'var(--color-foreground)' }}
                role="menuitem"
              >
                Notification preferences
              </Link>
              <div
                className="border-t my-1"
                style={{ borderColor: 'var(--color-border)' }}
              />
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--color-muted)]"
                style={{ color: 'var(--color-destructive)' }}
                role="menuitem"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
