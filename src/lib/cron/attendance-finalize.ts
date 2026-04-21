// @anchor: cca.attendance.cron-logic
// Nightly attendance finalization: mark absences, calculate hours, finalize records.

import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { getActiveTenants, SYSTEM_ACTOR_ID } from '@/lib/cron/helpers'

interface AttendanceFinalizeSummary {
  tenants: number
  records_finalized: number
  absent_marked: number
}

export async function runAttendanceFinalizeForAllTenants(): Promise<AttendanceFinalizeSummary> {
  const supabase = createAdminClient()
  const tenants = await getActiveTenants(supabase)

  const summary: AttendanceFinalizeSummary = {
    tenants: tenants.length,
    records_finalized: 0,
    absent_marked: 0,
  }

  const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD
  const now = new Date()

  for (const tenant of tenants) {
    try {
      // ── a. Get students with active classroom assignments today ──
      const { data: activeAssignments, error: assignErr } = await supabase
        .from('student_classroom_assignments')
        .select('student_id')
        .eq('tenant_id', tenant.id)
        .lte('assigned_from', today)
        .or(`assigned_to.is.null,assigned_to.gte.${today}`)

      if (assignErr) {
        console.error(`[cron:attendance] Assignment query error for tenant ${tenant.slug}:`, assignErr.message)
        continue
      }

      const activeStudentIds = [...new Set((activeAssignments ?? []).map((a) => a.student_id))]
      if (activeStudentIds.length === 0) continue

      // ── b. Get existing attendance records for today ──
      const { data: existingRecords, error: recErr } = await supabase
        .from('attendance_records')
        .select('student_id, id, finalized_at, check_in_id, check_out_id')
        .eq('tenant_id', tenant.id)
        .eq('date', today)

      if (recErr) {
        console.error(`[cron:attendance] Records query error for tenant ${tenant.slug}:`, recErr.message)
        continue
      }

      const recordsByStudent = new Map(
        (existingRecords ?? []).map((r) => [r.student_id, r]),
      )

      // ── c. Mark absent for students with no attendance record ──
      const missingStudentIds = activeStudentIds.filter(
        (sid) => !recordsByStudent.has(sid),
      )

      if (missingStudentIds.length > 0) {
        const absentRows = missingStudentIds.map((studentId) => ({
          tenant_id: tenant.id,
          student_id: studentId,
          date: today,
          status: 'absent',
          finalized_at: now.toISOString(),
          hours_present: 0,
        }))

        const { error: insertErr } = await supabase
          .from('attendance_records')
          .insert(absentRows)

        if (insertErr) {
          console.error(`[cron:attendance] Absent insert error for tenant ${tenant.slug}:`, insertErr.message)
        } else {
          summary.absent_marked += missingStudentIds.length
        }
      }

      // ── d. Calculate hours_present for non-finalized records ──
      const nonFinalized = (existingRecords ?? []).filter((r) => !r.finalized_at)

      if (nonFinalized.length > 0) {
        // Gather all check_in and check_out IDs we need
        const checkInIds = nonFinalized
          .filter((r) => r.check_in_id)
          .map((r) => r.check_in_id as string)

        const checkOutIds = nonFinalized
          .filter((r) => r.check_out_id)
          .map((r) => r.check_out_id as string)

        // Fetch check-in times
        const checkInMap = new Map<string, string>()
        if (checkInIds.length > 0) {
          const { data: checkIns } = await supabase
            .from('check_ins')
            .select('id, checked_in_at')
            .in('id', checkInIds)

          for (const ci of checkIns ?? []) {
            checkInMap.set(ci.id, ci.checked_in_at)
          }
        }

        // Fetch check-out times
        const checkOutMap = new Map<string, string>()
        if (checkOutIds.length > 0) {
          const { data: checkOuts } = await supabase
            .from('check_outs')
            .select('id, checked_out_at')
            .in('id', checkOutIds)

          for (const co of checkOuts ?? []) {
            checkOutMap.set(co.id, co.checked_out_at)
          }
        }

        // Calculate hours and batch-update
        const updates: { id: string; hours_present: number }[] = []

        for (const record of nonFinalized) {
          let hoursPresent = 0

          if (record.check_in_id && record.check_out_id) {
            // Both check-in and check-out exist
            const inTime = checkInMap.get(record.check_in_id)
            const outTime = checkOutMap.get(record.check_out_id)
            if (inTime && outTime) {
              const diffMs = new Date(outTime).getTime() - new Date(inTime).getTime()
              hoursPresent = Math.min(diffMs / (1000 * 60 * 60), 12)
            }
          } else if (record.check_in_id) {
            // Check-in only: calculate from check-in to now, cap at 12
            const inTime = checkInMap.get(record.check_in_id)
            if (inTime) {
              const diffMs = now.getTime() - new Date(inTime).getTime()
              hoursPresent = Math.min(diffMs / (1000 * 60 * 60), 12)
            }
          }
          // No check_in_id means no attendance time — hours stays 0

          hoursPresent = Math.round(hoursPresent * 100) / 100 // 2 decimal places
          updates.push({ id: record.id, hours_present: hoursPresent })
        }

        // Batch-update: finalize all non-finalized records
        for (const upd of updates) {
          const { error: updErr } = await supabase
            .from('attendance_records')
            .update({
              finalized_at: now.toISOString(),
              hours_present: upd.hours_present,
            })
            .eq('id', upd.id)

          if (updErr) {
            console.error(`[cron:attendance] Update error for record ${upd.id}:`, updErr.message)
          } else {
            summary.records_finalized++
          }
        }
      }

      // ── e. Audit entry ──
      await writeAudit(supabase, {
        tenantId: tenant.id,
        actorId: SYSTEM_ACTOR_ID,
        action: 'attendance.batch_finalize',
        entityType: 'attendance_records',
        entityId: tenant.id, // tenant-level operation
        after: {
          date: today,
          records_finalized: summary.records_finalized,
          absent_marked: summary.absent_marked,
        },
      })
    } catch (err) {
      console.error(`[cron:attendance] Unhandled error for tenant ${tenant.slug}:`, err)
    }
  }

  console.log('[cron:attendance] Summary:', summary)
  return summary
}
