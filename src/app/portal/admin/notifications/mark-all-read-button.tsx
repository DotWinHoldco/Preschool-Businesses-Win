'use client'

// @anchor: cca.notifications.mark-all-read-button
// Client button to mark all notifications as read via server action.

import { useTransition } from 'react'
import { markAllNotificationsRead } from '@/lib/actions/notifications/mark-read'

export function MarkAllReadButton() {
  const [isPending, startTransition] = useTransition()

  return (
    <button
      onClick={() => startTransition(async () => { await markAllNotificationsRead() })}
      disabled={isPending}
      className="rounded-lg px-4 py-2 text-sm font-medium transition-opacity disabled:opacity-50"
      style={{
        backgroundColor: 'var(--color-primary)',
        color: 'var(--color-primary-foreground)',
      }}
    >
      {isPending ? 'Marking...' : 'Mark all read'}
    </button>
  )
}
