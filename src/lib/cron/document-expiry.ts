// @anchor: cca.documents.cron-logic
// Daily document expiration check: expire overdue docs, notify on upcoming expirations.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/send'
import { getAdminUserIds, deduplicateNotification } from '@/lib/cron/helpers'

interface DocumentExpirySummary {
  expired_updated: number
  notifications_sent: number
  documents_checked: number
}

export async function runDocumentExpiryCheckForAllTenants(): Promise<DocumentExpirySummary> {
  const supabase = createAdminClient()
  const now = new Date()
  const nowISO = now.toISOString()
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()

  const summary: DocumentExpirySummary = {
    expired_updated: 0,
    notifications_sent: 0,
    documents_checked: 0,
  }

  // ── 1. Mark already-expired documents ──
  const { data: expiredDocs, error: expiredErr } = await supabase
    .from('documents')
    .select('id')
    .lt('expiry_date', nowISO)
    .eq('status', 'active')

  if (!expiredErr && expiredDocs && expiredDocs.length > 0) {
    const expiredIds = expiredDocs.map((d) => d.id)
    const { error: updateErr } = await supabase
      .from('documents')
      .update({ status: 'expired' })
      .in('id', expiredIds)

    if (!updateErr) {
      summary.expired_updated = expiredIds.length
    }
  }

  // ── 2. Find documents expiring within 30 days ──
  const { data: expiringDocs, error: expiringErr } = await supabase
    .from('documents')
    .select('id, tenant_id, name, expiry_date, entity_type, entity_id')
    .gte('expiry_date', nowISO)
    .lte('expiry_date', thirtyDaysFromNow)
    .eq('status', 'active')

  if (expiringErr) {
    return summary
  }

  if (!expiringDocs || expiringDocs.length === 0) {
    return summary
  }

  summary.documents_checked = expiringDocs.length

  // ── 3. Process each expiring document ──
  for (const doc of expiringDocs) {
    try {
      const daysUntilExpiry = Math.ceil(
        (new Date(doc.expiry_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
      )
      const urgency = daysUntilExpiry <= 7 ? 'critical' : 'warning'

      // ── 3a. Determine document owner ──
      let ownerUserId: string | null = null

      if (doc.entity_type === 'student') {
        // Look up family via student_family_links -> family_members.user_id
        const { data: familyLinks } = await supabase
          .from('student_family_links')
          .select('family_member_id')
          .eq('student_id', doc.entity_id)
          .limit(1)

        if (familyLinks && familyLinks.length > 0) {
          const { data: familyMember } = await supabase
            .from('family_members')
            .select('user_id')
            .eq('id', familyLinks[0].family_member_id)
            .single()

          ownerUserId = familyMember?.user_id ?? null
        }
      } else if (doc.entity_type === 'staff') {
        const { data: staffProfile } = await supabase
          .from('staff_profiles')
          .select('user_id')
          .eq('id', doc.entity_id)
          .single()

        ownerUserId = staffProfile?.user_id ?? null
      }

      // ── 3b. Get admin user IDs for this tenant ──
      const adminIds = await getAdminUserIds(supabase, doc.tenant_id)

      // Collect all recipients (owner + admins, deduplicated)
      const recipientSet = new Set(adminIds)
      if (ownerUserId) recipientSet.add(ownerUserId)
      const recipients = [...recipientSet]

      if (recipients.length === 0) continue

      // ── 3c. Deduplicate notifications ──
      let allDeduped = true
      for (const userId of recipients) {
        const alreadySent = await deduplicateNotification(supabase, {
          tenantId: doc.tenant_id,
          userId,
          template: 'document_expiring',
          entityId: doc.id,
          withinHours: 24,
        })
        if (!alreadySent) {
          allDeduped = false
          break
        }
      }

      if (allDeduped) continue

      // ── 3d. Send notification ──
      await sendNotification({
        tenantId: doc.tenant_id,
        to: recipients,
        template: 'document_expiring',
        payload: {
          entity_id: doc.id,
          document_name: doc.name,
          expiry_date: doc.expiry_date,
          days_until_expiry: daysUntilExpiry,
          entity_type: doc.entity_type,
        },
        channels: ['in_app'],
        urgency: urgency === 'critical' ? 'critical' : 'normal',
      })

      summary.notifications_sent++
    } catch {
      // Error processing document
    }
  }

  return summary
}
