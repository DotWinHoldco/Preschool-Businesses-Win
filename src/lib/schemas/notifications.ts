// @anchor: cca.notifications.schema
// Zod schemas for notification preferences and row actions.

import { z } from 'zod'

export const NotificationChannelEnum = z.enum(['email', 'sms', 'in_app', 'push'])
export type NotificationChannel = z.infer<typeof NotificationChannelEnum>

export const NotificationPreferenceRowSchema = z.object({
  notification_type: z.string().min(1).max(80),
  channel: NotificationChannelEnum,
  enabled: z.boolean(),
})

export type NotificationPreferenceRow = z.infer<typeof NotificationPreferenceRowSchema>

export const SaveNotificationPreferencesSchema = z.object({
  prefs: z.array(NotificationPreferenceRowSchema).min(1),
})

export type SaveNotificationPreferencesInput = z.infer<typeof SaveNotificationPreferencesSchema>
