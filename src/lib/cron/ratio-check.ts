// @anchor: cca.dfps.cron-logic
// Ratio compliance check — runs for every active tenant.
// Compares current student/staff counts per classroom against DFPS requirements.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendNotification } from '@/lib/notifications/send'
import { getActiveTenants, getAdminUserIds } from './helpers'

interface RatioCheckSummary {
  tenants_checked: number
  classrooms_checked: number
  violations: number
}

export async function runRatioCheckForAllTenants(): Promise<RatioCheckSummary> {
  const supabase = createAdminClient()
  const tenants = await getActiveTenants(supabase)
  const today = new Date().toISOString().split('T')[0]

  const summary: RatioCheckSummary = {
    tenants_checked: 0,
    classrooms_checked: 0,
    violations: 0,
  }

  // Load DFPS ratio requirements once (reference table, not tenant-scoped)
  const { data: ratioReqs } = await supabase
    .from('dfps_ratio_requirements')
    .select('age_group, max_ratio')

  const ratioMap = new Map<string, number>()
  for (const req of ratioReqs ?? []) {
    ratioMap.set(req.age_group, req.max_ratio)
  }

  for (const tenant of tenants) {
    try {
      summary.tenants_checked++

      // (a) Get classrooms
      const { data: classrooms } = await supabase
        .from('classrooms')
        .select('id, name, age_group, capacity')
        .eq('tenant_id', tenant.id)

      if (!classrooms || classrooms.length === 0) continue

      // (b) Get today's checked-in (not checked-out) students with classroom assignment
      const { data: checkedIn } = await supabase
        .from('attendance_records')
        .select(`
          student_id,
          student_classroom_assignments!inner(classroom_id)
        `)
        .eq('date', today)
        .not('check_in_id', 'is', null)
        .is('check_out_id', null)

      // (c) Get current staff assignments
      const { data: staffAssignments } = await supabase
        .from('classroom_staff_assignments')
        .select('classroom_id, staff_id')
        .eq('tenant_id', tenant.id)
        .lte('assigned_from', today)
        .or(`assigned_to.is.null,assigned_to.gte.${today}`)

      // Group student counts by classroom
      const studentCounts = new Map<string, number>()
      for (const record of checkedIn ?? []) {
        // student_classroom_assignments is joined — extract classroom_id
        const assignments = record.student_classroom_assignments as unknown as
          | { classroom_id: string }
          | { classroom_id: string }[]
        const assignmentList = Array.isArray(assignments)
          ? assignments
          : [assignments]
        for (const a of assignmentList) {
          studentCounts.set(
            a.classroom_id,
            (studentCounts.get(a.classroom_id) ?? 0) + 1,
          )
        }
      }

      // Group staff counts by classroom
      const staffCounts = new Map<string, number>()
      for (const sa of staffAssignments ?? []) {
        staffCounts.set(
          sa.classroom_id,
          (staffCounts.get(sa.classroom_id) ?? 0) + 1,
        )
      }

      // Evaluate each classroom
      const complianceLogs: Array<Record<string, unknown>> = []
      const violationClassrooms: Array<{
        name: string
        studentCount: number
        staffCount: number
        requiredRatio: number
      }> = []

      for (const classroom of classrooms) {
        summary.classrooms_checked++
        const studentCount = studentCounts.get(classroom.id) ?? 0
        const staffCount = staffCounts.get(classroom.id) ?? 0
        const requiredRatio = ratioMap.get(classroom.age_group) ?? 10 // default fallback

        const actualRatio = staffCount > 0 ? studentCount / staffCount : (studentCount > 0 ? Infinity : 0)
        const isCompliant = actualRatio <= requiredRatio

        complianceLogs.push({
          tenant_id: tenant.id,
          classroom_id: classroom.id,
          checked_at: new Date().toISOString(),
          student_count: studentCount,
          staff_count: staffCount,
          required_ratio: requiredRatio,
          is_compliant: isCompliant,
          age_group: classroom.age_group,
        })

        if (!isCompliant) {
          summary.violations++
          violationClassrooms.push({
            name: classroom.name,
            studentCount,
            staffCount,
            requiredRatio,
          })
        }
      }

      // (g) Batch insert compliance logs
      if (complianceLogs.length > 0) {
        const { error: insertError } = await supabase
          .from('ratio_compliance_log')
          .insert(complianceLogs)

        if (insertError) {
          console.error(
            `[cron:ratio-check] Log insert failed for tenant ${tenant.slug}:`,
            insertError.message,
          )
        }
      }

      // (h) Notify admins about violations
      if (violationClassrooms.length > 0) {
        const adminIds = await getAdminUserIds(supabase, tenant.id)
        if (adminIds.length > 0) {
          await sendNotification({
            tenantId: tenant.id,
            to: adminIds,
            template: 'ratio_violation',
            payload: {
              violations: violationClassrooms,
              checked_at: new Date().toISOString(),
            },
            channels: ['in_app'],
            urgency: 'critical',
          })
        }
      }
    } catch (err) {
      console.error(
        `[cron:ratio-check] Error processing tenant ${tenant.slug}:`,
        err,
      )
    }
  }

  console.log(
    `[cron:ratio-check] Done — ${summary.tenants_checked} tenants, ${summary.classrooms_checked} classrooms, ${summary.violations} violations`,
  )

  return summary
}
