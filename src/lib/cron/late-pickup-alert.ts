// @anchor: cca.checkin.cron-logic
// Late pickup alert — checks for students still present after tenant closing time.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/send'
import {
  getActiveTenants,
  getAdminUserIds,
  deduplicateNotification,
} from './helpers'

interface LatePickupSummary {
  tenants_checked: number
  tenants_past_closing: number
  students_still_present: number
  alerts_sent: number
}

export async function runLatePickupAlertForAllTenants(): Promise<LatePickupSummary> {
  const supabase = createAdminClient()
  const tenants = await getActiveTenants(supabase)
  const today = new Date().toISOString().split('T')[0]

  const summary: LatePickupSummary = {
    tenants_checked: 0,
    tenants_past_closing: 0,
    students_still_present: 0,
    alerts_sent: 0,
  }

  for (const tenant of tenants) {
    try {
      summary.tenants_checked++

      // (a) Get tenant closing time
      const { data: tenantRow } = await supabase
        .from('tenants')
        .select('settings')
        .eq('id', tenant.id)
        .single()

      const settings = (tenantRow?.settings ?? {}) as Record<string, unknown>
      const closingTime = (settings.closing_time as string) ?? '18:00'

      // (b) Check if current time is past closing
      const now = new Date()
      const [closeHour, closeMin] = closingTime.split(':').map(Number)
      const closingDate = new Date(now)
      closingDate.setHours(closeHour, closeMin, 0, 0)

      if (now <= closingDate) {
        // Not past closing time yet — skip
        continue
      }

      summary.tenants_past_closing++

      // (d) Find students still present
      const { data: presentRecords } = await supabase
        .from('attendance_records')
        .select('id, student_id')
        .eq('date', today)
        .not('check_in_id', 'is', null)
        .is('check_out_id', null)

      if (!presentRecords || presentRecords.length === 0) continue

      summary.students_still_present += presentRecords.length

      const adminIds = await getAdminUserIds(supabase, tenant.id)

      for (const record of presentRecords) {
        // (e) Look up family contacts for this student
        const { data: familyLinks } = await supabase
          .from('student_family_links')
          .select('family_member_id, family_members(user_id)')
          .eq('student_id', record.student_id)

        const parentUserIds: string[] = []
        for (const link of familyLinks ?? []) {
          const fm = link.family_members as unknown as { user_id: string } | null
          if (fm?.user_id) {
            parentUserIds.push(fm.user_id)
          }
        }

        // Collect all recipients (parents + admins, deduplicated)
        const allRecipients = [...new Set([...parentUserIds, ...adminIds])]

        // (f) Dedup per student per day
        let alreadySent = false
        if (allRecipients.length > 0) {
          // Check dedup against the first recipient — entity_id scopes it to this student
          alreadySent = await deduplicateNotification(supabase, {
            tenantId: tenant.id,
            userId: allRecipients[0],
            template: 'late_pickup',
            entityId: record.student_id,
            withinHours: 12,
          })
        }

        if (alreadySent || allRecipients.length === 0) continue

        // (g) Send notification
        await sendNotification({
          tenantId: tenant.id,
          to: allRecipients,
          template: 'late_pickup',
          payload: {
            student_id: record.student_id,
            entity_id: record.student_id,
            date: today,
            closing_time: closingTime,
          },
          channels: ['in_app'],
          urgency: 'high',
        })

        summary.alerts_sent++
      }
    } catch (err) {
      console.error(
        `[cron:late-pickup] Error processing tenant ${tenant.slug}:`,
        err,
      )
    }
  }

  console.log(
    `[cron:late-pickup] Done — ${summary.tenants_checked} tenants, ${summary.students_still_present} students still present, ${summary.alerts_sent} alerts sent`,
  )

  return summary
}
