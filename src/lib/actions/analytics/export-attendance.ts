'use server'

// @anchor: cca.analytics.export-attendance
// Export the last N days of attendance_records as CSV.

import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type CsvResult = { ok: boolean; csv?: string; filename?: string; error?: string }

function esc(v: unknown): string {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'string' ? v : String(v)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function exportAttendanceCSV(days = 30): Promise<CsvResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString().slice(0, 10)

  const { data, error } = await supabase
    .from('attendance_records')
    .select('id, student_id, classroom_id, date, status, check_in, check_out, created_at')
    .eq('tenant_id', tenantId)
    .gte('date', sinceIso)
    .order('date', { ascending: false })
    .limit(5000)

  if (error) return { ok: false, error: error.message }

  const header = ['date', 'student_id', 'classroom_id', 'status', 'check_in', 'check_out']
  const lines = [header.map(esc).join(',')]
  for (const r of data ?? []) {
    lines.push(
      [
        r.date,
        r.student_id,
        r.classroom_id ?? '',
        r.status ?? '',
        r.check_in ?? '',
        r.check_out ?? '',
      ]
        .map(esc)
        .join(','),
    )
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'analytics.attendance.export_csv',
    entityType: 'analytics',
    entityId: 'attendance',
    after: { days, rows: data?.length ?? 0 },
  })

  return { ok: true, csv: lines.join('\n'), filename: `attendance-${sinceIso}.csv` }
}
