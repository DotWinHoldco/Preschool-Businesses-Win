// @anchor: cca.analytics.attendance-page
// Attendance analytics — last 30 days of attendance_records, bucketed by date + status.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CsvExportButton } from '@/components/portal/analytics/csv-export-button'
import { exportAttendanceCSV } from '@/lib/actions/analytics/export-attendance'

const STATUS_VALUES = ['present', 'absent', 'late', 'excused'] as const
type Status = (typeof STATUS_VALUES)[number]

export default async function AttendanceAnalyticsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceIso = since.toISOString().slice(0, 10)

  const [{ data: records }, { data: classrooms }] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('date, status, classroom_id')
      .eq('tenant_id', tenantId)
      .gte('date', sinceIso)
      .limit(10000),
    supabase.from('classrooms').select('id').eq('tenant_id', tenantId),
  ])

  const rows = records ?? []

  let totalPresent = 0
  let totalAbsent = 0
  const classroomsSeen = new Set<string>()

  const perDay = new Map<string, Record<Status, number> & { total: number }>()
  for (const r of rows) {
    const dateKey = r.date as string
    if (!perDay.has(dateKey)) {
      perDay.set(dateKey, { present: 0, absent: 0, late: 0, excused: 0, total: 0 })
    }
    const bucket = perDay.get(dateKey)!
    const status = (r.status as Status) ?? 'absent'
    if (STATUS_VALUES.includes(status)) {
      bucket[status] = (bucket[status] ?? 0) + 1
    }
    bucket.total += 1
    if (status === 'present') totalPresent += 1
    if (status === 'absent') totalAbsent += 1
    if (r.classroom_id) classroomsSeen.add(r.classroom_id as string)
  }

  const attendanceRate = rows.length ? Math.round((totalPresent / rows.length) * 1000) / 10 : 0

  const days = Array.from(perDay.keys()).sort().reverse()
  const maxTotal = days.reduce((m, d) => Math.max(m, perDay.get(d)?.total ?? 0), 0)
  const classroomsTracked = classrooms?.length ?? classroomsSeen.size

  const stats = [
    { label: 'Total Present', value: totalPresent.toLocaleString() },
    { label: 'Total Absent', value: totalAbsent.toLocaleString() },
    { label: 'Attendance Rate', value: `${attendanceRate}%` },
    { label: 'Classrooms Tracked', value: classroomsTracked.toString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Attendance Analytics
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Last 30 days. Updated live from attendance records.
          </p>
        </div>
        <CsvExportButton
          action={exportAttendanceCSV}
          label="Export CSV"
          fallbackFilename="attendance.csv"
        />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Daily Breakdown
          </h2>
        </div>
        {days.length === 0 ? (
          <p className="px-4 pb-6 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No attendance records in the last 30 days.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Date', 'Present', 'Absent', 'Late', 'Excused', 'Total', 'Rate'].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((d) => {
                const b = perDay.get(d)!
                const dayRate = b.total ? Math.round((b.present / b.total) * 100) : 0
                const width = maxTotal ? Math.round((b.total / maxTotal) * 100) : 0
                return (
                  <tr key={d} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-2 font-mono text-xs">{d}</td>
                    <td className="px-4 py-2">{b.present}</td>
                    <td className="px-4 py-2">{b.absent}</td>
                    <td className="px-4 py-2">{b.late}</td>
                    <td className="px-4 py-2">{b.excused}</td>
                    <td className="px-4 py-2 font-semibold">{b.total}</td>
                    <td className="px-4 py-2">
                      <div
                        className="relative h-2 w-24 rounded-full"
                        style={{ backgroundColor: 'var(--color-muted)' }}
                      >
                        <div
                          className="absolute left-0 top-0 h-2 rounded-full"
                          style={{
                            width: `${width}%`,
                            backgroundColor: 'var(--color-primary)',
                          }}
                        />
                      </div>
                      <span
                        className="ml-2 text-xs"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        {dayRate}%
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
