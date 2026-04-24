'use client'

// @anchor: cca.notifications.notification-row
// Notification row with click-to-mark-read, explicit Mark Read, and Dismiss.

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check, X } from 'lucide-react'
import { markNotificationRead, deleteNotification } from '@/lib/actions/notifications/mark-read'

interface NotificationRowProps {
  id: string
  title: string
  body: string | null
  read: boolean
  urgency: string | null
  timeAgo: string
  isLast: boolean
}

export function NotificationRow({
  id,
  title,
  body,
  read,
  urgency,
  timeAgo,
  isLast,
}: NotificationRowProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function markRead(e?: React.MouseEvent) {
    if (e) {
      e.stopPropagation()
    }
    if (read) return
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  function handleRowClick() {
    if (!read) markRead()
  }

  function dismiss(e: React.MouseEvent) {
    e.stopPropagation()
    startTransition(async () => {
      await deleteNotification(id)
      router.refresh()
    })
  }

  const isUrgent = urgency === 'urgent' || urgency === 'critical'

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleRowClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') handleRowClick()
      }}
      aria-disabled={isPending}
      className="flex w-full items-start gap-3 px-4 py-4 text-left transition-colors"
      style={{
        borderBottom: isLast ? 'none' : '1px solid var(--color-border)',
        borderLeft: read ? '3px solid transparent' : '3px solid var(--color-primary)',
        backgroundColor: read
          ? 'transparent'
          : 'color-mix(in srgb, var(--color-primary) 4%, transparent)',
        opacity: isPending ? 0.6 : 1,
        cursor: read ? 'default' : 'pointer',
      }}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0">
        {!read ? (
          <span
            className="block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: isUrgent ? 'var(--color-destructive)' : 'var(--color-primary)',
            }}
          />
        ) : (
          <span className="block h-2.5 w-2.5" />
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <p
            className={`truncate text-sm ${read ? 'font-normal' : 'font-semibold'}`}
            style={{ color: 'var(--color-foreground)' }}
          >
            {title}
          </p>
          <span
            className="flex-shrink-0 text-xs"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {timeAgo}
          </span>
        </div>
        {body && (
          <p
            className="mt-0.5 line-clamp-2 text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {body}
          </p>
        )}
        {isUrgent && (
          <span
            className="mt-1.5 inline-flex rounded px-1.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-destructive) 12%, transparent)',
              color: 'var(--color-destructive)',
            }}
          >
            Urgent
          </span>
        )}
      </div>

      {/* Row actions */}
      <div className="flex flex-shrink-0 items-center gap-1">
        {!read && (
          <button
            type="button"
            onClick={markRead}
            disabled={isPending}
            className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-50"
            style={{ color: 'var(--color-muted-foreground)' }}
            aria-label="Mark as read"
          >
            <Check size={14} /> Mark read
          </button>
        )}
        <button
          type="button"
          onClick={dismiss}
          disabled={isPending}
          className="inline-flex h-8 items-center gap-1 rounded-md px-2 text-xs font-medium hover:bg-[var(--color-muted)] disabled:opacity-50"
          style={{ color: 'var(--color-muted-foreground)' }}
          aria-label="Dismiss notification"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
