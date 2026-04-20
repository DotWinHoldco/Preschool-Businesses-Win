// @anchor: cca.attendance.admin-dashboard
// School-wide attendance dashboard for admin — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'

export default async function AttendanceDashboardPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)
  const today = new Date().toISOString().split('T')[0]

  // Fetch attendance records for today and active student count in parallel
  const [{ data: attendanceRows }, { count: totalEnrolled }] = await Promise.all([
    supabase
      .from('attendance_records')
      .select('id, status, student_id')
      .eq('tenant_id', tenantId)
      .eq('date', today),
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('enrollment_status', 'active'),
  ])

  const records = attendanceRows ?? []
  const enrolled = totalEnrolled ?? 0

  // Group by status
  const presentCount = records.filter((r) => r.status === 'present').length
  const absentCount = records.filter((r) => r.status === 'absent').length
  const lateCount = records.filter((r) => r.status === 'late').length
  const attendanceRate = enrolled > 0 ? Math.round(((presentCount + lateCount) / enrolled) * 100) : 0

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Attendance</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <Users size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{enrolled}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Enrolled</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-success)]/10">
              <UserCheck size={20} className="text-[var(--color-success)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{presentCount}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Present</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-destructive)]/10">
              <UserX size={20} className="text-[var(--color-destructive)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{absentCount}</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Absent</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning)]/10">
              <Clock size={20} className="text-[var(--color-warning)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{attendanceRate}%</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Attendance rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Records or empty state */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] py-16 text-center">
          <UserCheck size={40} className="mb-3 text-[var(--color-muted-foreground)]" />
          <p className="text-sm font-medium text-[var(--color-muted-foreground)]">No attendance records for today.</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { label: 'Present', count: presentCount, variant: 'success' as const },
                { label: 'Late', count: lateCount, variant: 'warning' as const },
                { label: 'Absent', count: absentCount, variant: 'danger' as const },
              ]
                .filter((row) => row.count > 0)
                .map((row) => (
                  <div
                    key={row.label}
                    className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-4"
                  >
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{row.label}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {row.count} student{row.count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <Badge variant={row.variant}>
                      {row.count}
                    </Badge>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
