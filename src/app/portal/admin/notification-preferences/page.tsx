// @anchor: cca.notifications.preferences-page
// Server wrapper — loads notification_preferences rows for the current user,
// renders the client form with initial values from DB.

import { loadNotificationPreferences } from '@/lib/actions/notifications/preferences'
import { NotificationPreferencesForm } from './preferences-form'

export default async function NotificationPreferencesPage() {
  const result = await loadNotificationPreferences()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Notification Preferences
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Choose which notifications you receive and how.
        </p>
      </div>

      <NotificationPreferencesForm initialRows={result.rows ?? []} loadError={result.error} />
    </div>
  )
}
