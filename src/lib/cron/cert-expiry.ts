// @anchor: cca.staff.cron-logic
// Certification expiry check — cross-tenant scan for certs expiring within 60 days.
// Buckets: <=7 days = critical, <=30 = warning, <=60 = notice.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/send'
import type { NotificationUrgency } from '@/lib/notifications/send'
import { getAdminUserIds, deduplicateNotification } from './helpers'

interface CertExpirySummary {
  certs_checked: number
  critical: number
  warning: number
  notice: number
  alerts_sent: number
}

function getUrgencyBucket(daysUntilExpiry: number): {
  bucket: 'critical' | 'warning' | 'notice'
  urgency: NotificationUrgency
} {
  if (daysUntilExpiry <= 7) return { bucket: 'critical', urgency: 'critical' }
  if (daysUntilExpiry <= 30) return { bucket: 'warning', urgency: 'high' }
  return { bucket: 'notice', urgency: 'normal' }
}

export async function runCertExpiryCheckForAllTenants(): Promise<CertExpirySummary> {
  const supabase = createAdminClient()
  const now = new Date()
  const sixtyDaysOut = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)

  const summary: CertExpirySummary = {
    certs_checked: 0,
    critical: 0,
    warning: 0,
    notice: 0,
    alerts_sent: 0,
  }

  // Single cross-tenant query for all expiring certs
  const { data: expiringCerts, error } = await supabase
    .from('staff_certifications')
    .select(
      `
      id,
      tenant_id,
      user_id,
      certification_name,
      expiry_date,
      user_profiles(first_name, last_name)
    `,
    )
    .gte('expiry_date', now.toISOString().split('T')[0])
    .lte('expiry_date', sixtyDaysOut.toISOString().split('T')[0])

  if (error) {
    return summary
  }

  if (!expiringCerts || expiringCerts.length === 0) {
    return summary
  }

  summary.certs_checked = expiringCerts.length

  for (const cert of expiringCerts) {
    try {
      const expiryDate = new Date(cert.expiry_date)
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      const { bucket, urgency } = getUrgencyBucket(daysUntilExpiry)

      // Count by bucket
      summary[bucket]++

      const profile = cert.user_profiles as unknown as {
        first_name: string
        last_name: string
      } | null
      const staffName = profile ? `${profile.first_name} ${profile.last_name}` : 'Staff member'

      // (a) Dedup per user + cert (24 hours)
      const alreadySent = await deduplicateNotification(supabase, {
        tenantId: cert.tenant_id,
        userId: cert.user_id,
        template: 'cert_expiring',
        entityId: cert.id,
        withinHours: 24,
      })

      if (alreadySent) continue

      // (b) Notify the staff member
      await sendNotification({
        tenantId: cert.tenant_id,
        to: cert.user_id,
        template: 'cert_expiring',
        payload: {
          entity_id: cert.id,
          certification_name: cert.certification_name,
          expiry_date: cert.expiry_date,
          days_until_expiry: daysUntilExpiry,
          staff_name: staffName,
          bucket,
        },
        channels: ['in_app'],
        urgency,
      })

      summary.alerts_sent++

      // (c) Also notify admins for critical certs
      if (bucket === 'critical') {
        const adminIds = await getAdminUserIds(supabase, cert.tenant_id)
        if (adminIds.length > 0) {
          await sendNotification({
            tenantId: cert.tenant_id,
            to: adminIds,
            template: 'cert_expiring',
            payload: {
              entity_id: cert.id,
              certification_name: cert.certification_name,
              expiry_date: cert.expiry_date,
              days_until_expiry: daysUntilExpiry,
              staff_name: staffName,
              bucket,
            },
            channels: ['in_app'],
            urgency: 'critical',
          })
        }
      }
    } catch {
      // Error processing cert
    }
  }

  return summary
}
