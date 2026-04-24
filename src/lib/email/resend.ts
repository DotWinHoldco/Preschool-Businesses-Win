// @anchor: cca.notify.email
// Resend email client for transactional emails

import { Resend } from 'resend'

let resendClient: Resend | null = null

export function getResendClient(): Resend | null {
  if (resendClient) return resendClient

  const key = process.env.RESEND_API_KEY
  if (!key || key === 'PLACEHOLDER_ADD_AFTER_BUILD') {
    console.warn('[Resend] No API key configured — emails will be logged only')
    return null
  }

  resendClient = new Resend(key)
  return resendClient
}

/**
 * Send an email via Resend
 * Returns a mock ID if no API key is configured
 */
export async function sendEmail({
  to,
  subject,
  html,
  from,
  replyTo,
}: {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}) {
  const client = getResendClient()

  const emailData = {
    from: from || 'Crandall Christian Academy <noreply@crandallchristianacademy.com>',
    to: Array.isArray(to) ? to : [to],
    subject,
    html,
    replyTo,
  }

  if (!client) {
    return { id: `mock-${Date.now()}` }
  }

  const { data, error } = await client.emails.send(emailData)
  if (error) {
    console.error('[Resend Error]', error)
    throw new Error(`Email send failed: ${error.message}`)
  }

  return data
}
