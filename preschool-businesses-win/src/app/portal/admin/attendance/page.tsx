// @anchor: cca.attendance.admin-dashboard
// School-wide attendance dashboard for admin.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users, UserCheck, UserX, Clock } from 'lucide-react'

export default async function AttendanceDashboardPage() {
  // TODO: Fetch real attendance data from Supabase
  const today = new Date().toISOString().split('T')[0]

  const summary = {
    total_enrolled: 62,
    present: 48,
    absent: 10,
    late: 4,
    rate: 77,
  }

  const classrooms = [
    { id: '1', name: 'Butterfly Room', present: 12, enrolled: 15, ratio: '6:1', compliant: true },
    { id: '2', name: 'Sunshine Room', present: 10, enrolled: 12, ratio: '5:1', compliant: true },
    { id: '3', name: 'Rainbow Room', present: 14, enrolled: 18, ratio: '14:1', compliant: false },
    { id: '4', name: 'Star Room', present: 12, enrolled: 17, ratio: '6:1', compliant: true },
  ]

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
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{summary.total_enrolled}</p>
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
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{summary.present}</p>
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
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{summary.absent}</p>
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
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{summary.rate}%</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">Attendance rate</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classroom breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>By Classroom</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {classrooms.map((cr) => (
              <div
                key={cr.id}
                className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{cr.name}</p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {cr.present} / {cr.enrolled} present
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[var(--color-foreground)]">
                    Ratio: {cr.ratio}
                  </span>
                  <Badge variant={cr.compliant ? 'success' : 'danger'}>
                    {cr.compliant ? 'Compliant' : 'Over ratio'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
