// @anchor: platform.cron.email-digest
// Daily email digest — sends a summary email to users with unread notifications.
// Called from /api/cron/email-digest daily.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

/** Max users per run to stay within Vercel function timeout */
const MAX_USERS_PER_RUN = 50

interface EmailDigestSummary {
  digests_sent: number
}

export async function runEmailDigestForAllTenants(): Promise<EmailDigestSummary> {
  const supabase = createAdminClient()

  const summary: EmailDigestSummary = {
    digests_sent: 0,
  }

  // Fetch all unread notifications from the last 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  const { data: notifications, error: notifErr } = await supabase
    .from('notifications')
    .select('user_id, tenant_id')
    .eq('read', false)
    .gte('created_at', cutoff)

  if (notifErr) {
    return summary
  }

  if (!notifications || notifications.length === 0) {
    return summary
  }

  // Group by user_id + tenant_id in JS
  const userTenantCounts: Record<string, { userId: string; tenantId: string; count: number }> = {}

  for (const n of notifications) {
    const key = `${n.user_id}::${n.tenant_id}`
    if (!userTenantCounts[key]) {
      userTenantCounts[key] = { userId: n.user_id, tenantId: n.tenant_id, count: 0 }
    }
    userTenantCounts[key].count++
  }

  const entries = Object.values(userTenantCounts).slice(0, MAX_USERS_PER_RUN)

  if (entries.length === 0) {
    return summary
  }

  // Batch-fetch all needed user profiles
  const userIds = [...new Set(entries.map((e) => e.userId))]
  const { data: profiles, error: profileErr } = await supabase
    .from('user_profiles')
    .select('id, email, first_name')
    .in('id', userIds)

  if (profileErr) {
    return summary
  }

  const profileMap: Record<string, { email: string | null; first_name: string | null }> = {}
  for (const p of profiles ?? []) {
    profileMap[p.id] = { email: p.email, first_name: p.first_name }
  }

  // Also fetch tenant info for portal links
  const tenantIds = [...new Set(entries.map((e) => e.tenantId))]
  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .in('id', tenantIds)

  const tenantMap: Record<string, { name: string; slug: string }> = {}
  for (const t of tenants ?? []) {
    tenantMap[t.id] = { name: t.name, slug: t.slug }
  }

  // Send digest for each user/tenant pair
  for (const entry of entries) {
    try {
      const profile = profileMap[entry.userId]
      if (!profile?.email) continue

      const tenant = tenantMap[entry.tenantId]
      const tenantName = tenant?.name ?? 'your school'
      const portalUrl = tenant?.slug
        ? `https://${tenant.slug}.preschool.businesses.win/portal`
        : 'https://preschool.businesses.win/portal'

      const firstName = profile.first_name ?? 'there'
      const unreadCount = entry.count
      const plural = unreadCount === 1 ? 'notification' : 'notifications'

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 32px 24px;">
          <h2 style="font-size: 18px; color: #1a1a1a; margin: 0 0 16px;">
            Hi ${firstName}, you have ${unreadCount} unread ${plural}
          </h2>
          <p style="font-size: 15px; color: #555; line-height: 1.6; margin: 0 0 24px;">
            You have <strong>${unreadCount}</strong> unread ${plural} from ${tenantName} in the last 24 hours.
            Log in to your portal to stay up to date.
          </p>
          <a href="${portalUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 15px; font-weight: 600;">
            View Notifications
          </a>
          <p style="font-size: 13px; color: #999; margin-top: 32px; line-height: 1.5;">
            You're receiving this because you have unread notifications. To stop these emails, mark your notifications as read in the portal.
          </p>
        </div>
      `

      await sendEmail({
        to: profile.email,
        subject: `You have ${unreadCount} unread ${plural} from ${tenantName}`,
        html,
      })

      summary.digests_sent++
    } catch {
      // Error sending digest
    }
  }

  return summary
}
