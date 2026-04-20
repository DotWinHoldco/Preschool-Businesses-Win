// @anchor: cca.notifications.admin-page
// Admin notifications page — lists notifications for the current user.

import type { Metadata } from 'next'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { MarkAllReadButton } from './mark-all-read-button'
import { NotificationRow } from './notification-row'

export const metadata: Metadata = {
  title: 'Notifications | Admin Portal',
  description: 'View and manage your notifications',
}

function timeAgo(dateString: string): string {
  const now = new Date()
  const date = new Date(dateString)
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks}w ago`
  return date.toLocaleDateString()
}

interface Notification {
  id: string
  tenant_id: string
  user_id: string
  template: string | null
  title: string
  body: string | null
  data: Record<string, unknown> | null
  read: boolean
  read_at: string | null
  urgency: string | null
  created_at: string
}

export default async function AdminNotificationsPage() {
  const session = await getSession()
  if (!session) redirect('/portal/login')

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const { data: notifications, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', session.user.id)
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const items: Notification[] = error ? [] : (notifications ?? [])
  const hasUnread = items.some((n) => !n.read)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Notifications
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {items.length === 0
              ? 'You have no notifications'
              : `${items.filter((n) => !n.read).length} unread`}
          </p>
        </div>
        {hasUnread && <MarkAllReadButton />}
      </div>

      {/* Notification list */}
      {items.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center rounded-xl py-20"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {/* Bell icon */}
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ color: 'var(--color-muted-foreground)', opacity: 0.5 }}
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          <p
            className="mt-4 text-base font-medium"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            No notifications yet
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)', opacity: 0.7 }}>
            You&apos;ll see updates here when something needs your attention.
          </p>
        </div>
      ) : (
        <div
          className="overflow-hidden rounded-xl"
          style={{
            backgroundColor: 'var(--color-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          {items.map((notification, idx) => (
            <NotificationRow
              key={notification.id}
              id={notification.id}
              title={notification.title}
              body={notification.body}
              read={notification.read}
              urgency={notification.urgency}
              timeAgo={timeAgo(notification.created_at)}
              isLast={idx === items.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  )
}
