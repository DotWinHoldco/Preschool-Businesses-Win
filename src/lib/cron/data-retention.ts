// @anchor: platform.cron.data-retention
// Cron logic: auto-anonymize families whose students have all withdrawn
// and whose retention period has expired.
// Reads privacy.auto_delete_withdrawn + privacy.retention_days from tenant_settings.

import { createAdminClient, createTenantAdminClient } from '@/lib/supabase/admin'
import { getActiveTenants, SYSTEM_ACTOR_ID } from './helpers'
import { writeAudit } from '@/lib/audit'

interface RetentionSummary {
  tenants_checked: number
  families_anonymized: number
  errors: number
}

export async function runDataRetentionForAllTenants(): Promise<RetentionSummary> {
  const adminClient = createAdminClient()
  const summary: RetentionSummary = {
    tenants_checked: 0,
    families_anonymized: 0,
    errors: 0,
  }

  const tenants = await getActiveTenants(adminClient)

  for (const tenant of tenants) {
    try {
      summary.tenants_checked++

      // Check if auto-delete is enabled for this tenant
      const { data: settingsRows } = await adminClient
        .from('tenant_settings')
        .select('key, value')
        .eq('tenant_id', tenant.id)
        .in('key', ['privacy.auto_delete_withdrawn', 'privacy.retention_days'])

      const settingsMap = new Map<string, string>()
      for (const row of settingsRows ?? []) {
        settingsMap.set(row.key as string, row.value as string)
      }

      const autoDelete = settingsMap.get('privacy.auto_delete_withdrawn') === 'true'
      if (!autoDelete) continue

      const retentionDays = Number(settingsMap.get('privacy.retention_days') || '730')
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      const cutoffIso = cutoffDate.toISOString()

      // Find families where ALL linked students have enrollment_status = 'withdrawn'
      // and the student's updated_at (proxy for withdrawal date) is past the retention cutoff
      const supabase = await createTenantAdminClient(tenant.id)

      // Get all families for this tenant
      const { data: families } = await supabase
        .from('families')
        .select('id, family_name')
        .eq('tenant_id', tenant.id)
        // Skip already-anonymized families
        .not('family_name', 'like', 'Anonymized Family%')

      if (!families || families.length === 0) continue

      for (const family of families) {
        try {
          const familyId = family.id as string

          // Get all student links for this family
          const { data: links } = await supabase
            .from('student_family_links')
            .select('student_id, students(enrollment_status, updated_at)')
            .eq('family_id', familyId)
            .eq('tenant_id', tenant.id)

          if (!links || links.length === 0) continue

          // Check: every student must be withdrawn and past the retention cutoff
          const allWithdrawnAndExpired = links.every((link) => {
            const student = link.students as unknown as {
              enrollment_status: string
              updated_at: string
            } | null
            if (!student) return false
            return (
              student.enrollment_status === 'withdrawn' &&
              student.updated_at < cutoffIso
            )
          })

          if (!allWithdrawnAndExpired) continue

          // Anonymize this family
          const idSuffix = familyId.slice(-4)

          // Anonymize family record
          await supabase
            .from('families')
            .update({
              family_name: `Anonymized Family ${idSuffix}`,
              billing_email: null,
              billing_phone: null,
              mailing_address_line1: null,
              mailing_address_line2: null,
              mailing_city: null,
              mailing_state: null,
              mailing_zip: null,
            })
            .eq('id', familyId)
            .eq('tenant_id', tenant.id)

          // Anonymize family members
          await supabase
            .from('family_members')
            .update({
              first_name: 'Anonymized',
              last_name: 'User',
              email: null,
              phone: null,
            })
            .eq('family_id', familyId)
            .eq('tenant_id', tenant.id)

          // Anonymize students
          const studentIds = links.map((l) => l.student_id as string)
          if (studentIds.length > 0) {
            await supabase
              .from('students')
              .update({
                first_name: 'Anonymized',
                last_name: 'Student',
                preferred_name: null,
                photo_path: null,
                notes_internal: null,
              })
              .eq('tenant_id', tenant.id)
              .in('id', studentIds)

            // Archive documents
            await supabase
              .from('documents')
              .update({ status: 'archived' })
              .eq('tenant_id', tenant.id)
              .eq('entity_type', 'student')
              .in('entity_id', studentIds)
          }

          // Audit
          await writeAudit(supabase, {
            tenantId: tenant.id,
            actorId: SYSTEM_ACTOR_ID,
            action: 'compliance.data_retention.auto_anonymized',
            entityType: 'family',
            entityId: familyId,
            after: {
              retention_days: retentionDays,
              students_anonymized: studentIds.length,
            },
          })

          summary.families_anonymized++

          console.log(
            `[cron:data-retention] Anonymized family ${familyId} in tenant ${tenant.slug} (${studentIds.length} students)`,
          )
        } catch (err) {
          summary.errors++
          console.error(
            `[cron:data-retention] Error processing family ${family.id} in tenant ${tenant.slug}:`,
            err,
          )
        }
      }
    } catch (err) {
      summary.errors++
      console.error(
        `[cron:data-retention] Error processing tenant ${tenant.slug}:`,
        err,
      )
    }
  }

  console.log(
    `[cron:data-retention] Done — ${summary.tenants_checked} tenants checked, ${summary.families_anonymized} families anonymized, ${summary.errors} errors`,
  )

  return summary
}
