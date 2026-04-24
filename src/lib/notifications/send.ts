// @anchor: cca.notify

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'
import { getNotificationText } from './templates'
import * as Sentry from '@sentry/nextjs'

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms'
export type NotificationUrgency = 'normal' | 'high' | 'critical'

export interface SendNotificationParams {
  tenantId: string
  to: string | string[]
  template: string
  payload: Record<string, unknown>
  channels: NotificationChannel[]
  urgency?: NotificationUrgency
}

export async function sendNotification({
  tenantId,
  to,
  template,
  payload,
  channels,
  urgency = 'normal',
}: SendNotificationParams): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to]
  const { title, body } = getNotificationText(template, payload)

  for (const channel of channels) {
    try {
      switch (channel) {
        case 'in_app': {
          const supabase = createAdminClient()
          const rows = recipients.map((userId) => ({
            tenant_id: tenantId,
            user_id: userId,
            title,
            body,
            template,
            urgency,
            data: payload,
            read: false,
          }))
          const { error } = await supabase.from('notifications').insert(rows)
          if (error) {
            Sentry.captureException(error, {
              tags: { subsystem: 'notification', channel: 'in_app' },
            })
          }
          break
        }

        case 'email': {
          const supabase = createAdminClient()
          const { data: profiles } = await supabase
            .from('user_profiles')
            .select('id, email, first_name')
            .in('id', recipients)

          for (const profile of profiles ?? []) {
            if (!profile.email) continue
            await sendEmail({
              to: profile.email,
              subject: title,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
                  <h2 style="font-size: 18px; color: #1a1a1a; margin: 0 0 12px;">${title}</h2>
                  <p style="font-size: 15px; color: #555; line-height: 1.6;">${body}</p>
                </div>
              `,
            })
          }
          break
        }

        case 'push':
          // TODO: Send via web-push / FCM
          break

        case 'sms':
          // TODO: Send via Twilio
          break
      }
    } catch (err) {
      Sentry.captureException(err, { tags: { subsystem: 'notification', channel } })
    }
  }
}
