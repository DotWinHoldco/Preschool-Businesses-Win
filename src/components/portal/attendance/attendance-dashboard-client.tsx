'use client'

// @anchor: cca.attendance.dashboard-client
// Interactive attendance dashboard: date + classroom filter, breakdown, amend, CSV export.

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, UserCheck, UserX, Users, Clock, FileEdit } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { amendAttendance } from '@/lib/actions/attendance/amend-by-student'
import { exportAttendanceCsv } from '@/lib/actions/attendance/export-csv'

export interface DashboardStudent {
  id: string
  first_name: string
  last_name: string
  classroom_id: string | null
}

export interface DashboardClassroom {
  id: string
  name: string
}

export interface DashboardRecord {
  id: string
  student_id: string
  classroom_id: string | null
  status: string
}

interface Props {
  initialDate: string
  initialClassroomId: string | null
  enrolled: number
  records: DashboardRecord[]
  classrooms: DashboardClassroom[]
  students: DashboardStudent[]
  classroomEnrollment: Record<string, number>
}

const STATUSES = ['present', 'absent', 'late', 'excused_absent', 'sick', 'early_pickup'] as const

export function AttendanceDashboardClient({
  initialDate,
  initialClassroomId,
  enrolled,
  records,
  classrooms,
  students,
  classroomEnrollment,
}: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [date, setDate] = useState(initialDate)
  const [classroomId, setClassroomId] = useState<string>(initialClassroomId ?? '')
  const [amendOpen, setAmendOpen] = useState(false)
  const [amendStudentId, setAmendStudentId] = useState('')
  const [amendStatus, setAmendStatus] = useState<(typeof STATUSES)[number]>('present')
  const [amendReason, setAmendReason] = useState('')
  const [amendError, setAmendError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const filteredRecords = useMemo(
    () => (classroomId ? records.filter((r) => r.classroom_id === classroomId) : records),
    [records, classroomId],
  )

  const presentCount = filteredRecords.filter((r) => r.status === 'present').length
  const absentCount = filteredRecords.filter(
    (r) => r.status === 'absent' || r.status === 'excused_absent',
  ).length
  const lateCount = filteredRecords.filter((r) => r.status === 'late').length
  const denominator = classroomId ? (classroomEnrollment[classroomId] ?? 0) : enrolled
  const attendanceRate =
    denominator > 0 ? Math.round(((presentCount + lateCount) / denominator) * 100) : 0

  const perClassroom = useMemo(() => {
    return classrooms.map((c) => {
      const cRecords = records.filter((r) => r.classroom_id === c.id)
      const p = cRecords.filter((r) => r.status === 'present').length
      const a = cRecords.filter(
        (r) => r.status === 'absent' || r.status === 'excused_absent',
      ).length
      const l = cRecords.filter((r) => r.status === 'late').length
      const n = classroomEnrollment[c.id] ?? 0
      const rate = n > 0 ? Math.round(((p + l) / n) * 100) : 0
      return { id: c.id, name: c.name, present: p, absent: a, late: l, rate, enrolled: n }
    })
  }, [classrooms, records, classroomEnrollment])

  const applyFilters = () => {
    const params = new URLSearchParams()
    if (date) params.set('date', date)
    if (classroomId) params.set('classroom_id', classroomId)
    const qs = params.toString()
    router.push(`/portal/admin/attendance${qs ? `?${qs}` : ''}`)
    router.refresh()
  }

  const handleAmend = () => {
    if (!amendStudentId || !amendReason.trim()) {
      setAmendError('Student and reason are required')
      return
    }
    setAmendError(null)
    startTransition(async () => {
      const result = await amendAttendance({
        student_id: amendStudentId,
        date,
        status: amendStatus,
        reason: amendReason.trim(),
      })
      if (!result.ok) {
        setAmendError(result.error ?? 'Failed to amend attendance')
        return
      }
      setAmendOpen(false)
      setAmendStudentId('')
      setAmendReason('')
      setAmendStatus('present')
      setFlash('Attendance amended.')
      router.refresh()
    })
  }

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportAttendanceCsv({
        date,
        classroom_id: classroomId || undefined,
      })
      if (!result.ok || !result.csv) {
        setFlash(`Export failed: ${result.error ?? 'unknown error'}`)
        return
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? `attendance-${date}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setFlash(`Exported ${result.row_count ?? 0} rows.`)
    })
  }

  const filteredStudents = useMemo(
    () => (classroomId ? students.filter((s) => s.classroom_id === classroomId) : students),
    [students, classroomId],
  )

  return (
    <div className="flex flex-col gap-6">
      {/* Filters + actions */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label
            htmlFor="att-date"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Date
          </label>
          <Input
            id="att-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            inputSize="sm"
          />
        </div>
        <div>
          <label
            htmlFor="att-classroom"
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Classroom
          </label>
          <Select
            id="att-classroom"
            value={classroomId}
            onChange={(e) => setClassroomId(e.target.value)}
          >
            <option value="">All classrooms</option>
            {classrooms.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </div>
        <Button size="sm" onClick={applyFilters} disabled={isPending}>
          Apply
        </Button>
        <div className="flex-1" />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setAmendOpen(true)}
          disabled={isPending}
        >
          <FileEdit size={14} /> Amend Attendance
        </Button>
        <Button size="sm" variant="secondary" onClick={handleExport} disabled={isPending}>
          <Download size={14} /> Export Day CSV
        </Button>
      </div>

      {flash && (
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {flash}
        </p>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
              <Users size={20} className="text-[var(--color-primary)]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[var(--color-foreground)]">{denominator}</p>
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

      {/* Per-classroom breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Classroom Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {perClassroom.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No classrooms.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)]">
                    <th className="py-2 text-left font-semibold text-[var(--color-foreground)]">
                      Classroom
                    </th>
                    <th className="py-2 text-right font-semibold text-[var(--color-foreground)]">
                      Enrolled
                    </th>
                    <th className="py-2 text-right font-semibold text-[var(--color-foreground)]">
                      Present
                    </th>
                    <th className="py-2 text-right font-semibold text-[var(--color-foreground)]">
                      Absent
                    </th>
                    <th className="py-2 text-right font-semibold text-[var(--color-foreground)]">
                      Late
                    </th>
                    <th className="py-2 text-right font-semibold text-[var(--color-foreground)]">
                      Rate
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {perClassroom.map((row) => (
                    <tr key={row.id} className="border-b border-[var(--color-border)]">
                      <td className="py-2 text-[var(--color-foreground)]">{row.name}</td>
                      <td className="py-2 text-right text-[var(--color-muted-foreground)]">
                        {row.enrolled}
                      </td>
                      <td className="py-2 text-right text-[var(--color-muted-foreground)]">
                        {row.present}
                      </td>
                      <td className="py-2 text-right text-[var(--color-muted-foreground)]">
                        {row.absent}
                      </td>
                      <td className="py-2 text-right text-[var(--color-muted-foreground)]">
                        {row.late}
                      </td>
                      <td className="py-2 text-right">
                        <Badge
                          variant={
                            row.rate >= 90 ? 'success' : row.rate >= 75 ? 'warning' : 'danger'
                          }
                        >
                          {row.rate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Amend dialog */}
      <Dialog open={amendOpen} onOpenChange={setAmendOpen}>
        <DialogOverlay onClick={() => setAmendOpen(false)} />
        <DialogContent title="Amend Attendance">
          <DialogClose onClick={() => setAmendOpen(false)} />
          <div className="space-y-4">
            <div>
              <label
                htmlFor="amend-student"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Student *
              </label>
              <Select
                id="amend-student"
                value={amendStudentId}
                onChange={(e) => setAmendStudentId(e.target.value)}
              >
                <option value="">Select student...</option>
                {filteredStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="amend-date"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Date
              </label>
              <Input
                id="amend-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                inputSize="sm"
              />
            </div>

            <div>
              <label
                htmlFor="amend-status"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                New status
              </label>
              <Select
                id="amend-status"
                value={amendStatus}
                onChange={(e) => setAmendStatus(e.target.value as (typeof STATUSES)[number])}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s.replace('_', ' ')}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label
                htmlFor="amend-reason"
                className="block text-sm font-medium mb-1"
                style={{ color: 'var(--color-foreground)' }}
              >
                Reason *
              </label>
              <textarea
                id="amend-reason"
                value={amendReason}
                onChange={(e) => setAmendReason(e.target.value)}
                rows={3}
                className="w-full rounded-[var(--radius,0.75rem)] border px-4 py-2 text-sm min-h-[48px]"
                style={{
                  borderColor: 'var(--color-border)',
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-foreground)',
                }}
                placeholder="Why is this amendment needed?"
              />
            </div>

            {amendError && (
              <p className="text-sm" style={{ color: 'var(--color-destructive)' }}>
                {amendError}
              </p>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setAmendOpen(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button size="sm" onClick={handleAmend} disabled={isPending} loading={isPending}>
                Save Amendment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
