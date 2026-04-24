// @anchor: cca.settings.notifications-page
// Server wrapper: loads persisted notifications settings.

import { loadTenantSettings } from '@/lib/actions/settings/tenant-settings'
import { NotificationsSettingsSchema } from '@/lib/schemas/settings'
import { NotificationsSettingsForm } from './notifications-form'

export default async function SettingsNotificationsPage() {
  const raw = await loadTenantSettings('notifications')
  const initialValues = NotificationsSettingsSchema.parse(raw)

  return <NotificationsSettingsForm initialValues={initialValues} />
}
