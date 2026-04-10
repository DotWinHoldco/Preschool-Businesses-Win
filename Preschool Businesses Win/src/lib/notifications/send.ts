// @anchor: cca.notify

export type NotificationChannel = 'in_app' | 'push' | 'email' | 'sms'
export type NotificationUrgency = 'normal' | 'high' | 'critical'

export interface SendNotificationParams {
  /** User ID or array of user IDs to notify */
  to: string | string[]
  /** Template key (e.g., 'checkin_confirmed', 'daily_report_ready') */
  template: string
  /** Dynamic data merged into the template */
  payload: Record<string, unknown>
  /** Which channels to dispatch on */
  channels: NotificationChannel[]
  /** Urgency level — affects delivery priority and visual treatment */
  urgency?: NotificationUrgency
}

/**
 * Dispatch a notification across the requested channels.
 * Stub implementation — logs to console until real providers are wired.
 */
export async function sendNotification({
  to,
  template,
  payload,
  channels,
  urgency = 'normal',
}: SendNotificationParams): Promise<void> {
  const recipients = Array.isArray(to) ? to : [to]

  for (const channel of channels) {
    switch (channel) {
      case 'in_app':
        // TODO: Insert into notifications table via Supabase
        console.log(
          `[notify:in_app] template=${template} urgency=${urgency} to=${recipients.join(',')}`,
          payload
        )
        break

      case 'push':
        // TODO: Send via FCM / APNs
        console.log(
          `[notify:push] template=${template} urgency=${urgency} to=${recipients.join(',')}`,
          payload
        )
        break

      case 'email':
        // TODO: Send via Resend / Postmark
        console.log(
          `[notify:email] template=${template} urgency=${urgency} to=${recipients.join(',')}`,
          payload
        )
        break

      case 'sms':
        // TODO: Send via Twilio
        console.log(
          `[notify:sms] template=${template} urgency=${urgency} to=${recipients.join(',')}`,
          payload
        )
        break
    }
  }
}
