'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { AllergyBadge, type AllergySeverity } from '@/components/portal/students/allergy-badge'
import { assignStudent, removeStudent } from '@/lib/actions/classroom/manage-roster'

interface RosterStudent {
  assignmentId: string
  studentId: string
  firstName: string
  lastName: string
  dateOfBirth: string
  photoPath: string | null
  enrollmentStatus: string
  programType: string
  allergies: Array<{ allergen: string; severity: AllergySeverity }>
}

interface AvailableStudent {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
}

interface ClassroomRosterManagerProps {
  classroomId: string
  roster: RosterStudent[]
  availableStudents: AvailableStudent[]
  calculateAge: (dob: string) => string
}

export function ClassroomRosterManager({
  classroomId,
  roster,
  availableStudents,
  calculateAge,
}: ClassroomRosterManagerProps) {
  const router = useRouter()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null)
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [programType, setProgramType] = useState('full_day')
  const [serverError, setServerError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const rosterStudentIds = new Set(roster.map((r) => r.studentId))
  const unassigned = availableStudents.filter((s) => !rosterStudentIds.has(s.id))

  function openAssign() {
    setSelectedStudentId(unassigned[0]?.id ?? '')
    setProgramType('full_day')
    setServerError(null)
    setDialogOpen(true)
  }

  function handleAssign() {
    if (!selectedStudentId) return
    setServerError(null)
    startTransition(async () => {
      const result = await assignStudent({
        student_id: selectedStudentId,
        classroom_id: classroomId,
        program_type: programType as 'full_day' | 'half_day_am' | 'half_day_pm' | 'before_care' | 'after_care' | 'summer',
      })
      if (!result.ok) {
        setServerError(result.error ?? 'Failed to assign student')
        return
      }
      setDialogOpen(false)
      router.refresh()
    })
  }

  function handleRemove(assignmentId: string) {
    setServerError(null)
    startTransition(async () => {
      const result = await removeStudent({
        assignment_id: assignmentId,
        classroom_id: classroomId,
      })
      if (!result.ok) {
        setServerError(result.error ?? 'Failed to remove student')
        return
      }
      setConfirmRemoveId(null)
      router.refresh()
    })
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            Student Roster
            <Badge variant="outline" size="sm">{roster.length}</Badge>
          </CardTitle>
          {unassigned.length > 0 && (
            <Button variant="primary" size="sm" onClick={openAssign}>
              Assign Student
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {roster.length === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">No students assigned to this classroom</p>
              {unassigned.length > 0 && (
                <Button variant="secondary" size="sm" onClick={openAssign}>Assign Student</Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {roster.map((student) => {
                const initials = `${student.firstName[0]}${student.lastName[0]}`.toUpperCase()
                return (
                  <div
                    key={student.assignmentId}
                    className="group flex items-center gap-3 rounded-lg border border-[var(--color-border)] p-3"
                  >
                    <a href={`/portal/admin/students/${student.studentId}`}>
                      {student.photoPath ? (
                        <img src={student.photoPath} alt="" className="h-8 w-8 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-muted-foreground)]">
                          {initials}
                        </div>
                      )}
                    </a>
                    <a href={`/portal/admin/students/${student.studentId}`} className="min-w-0 flex-1 hover:underline">
                      <p className="text-sm font-medium text-[var(--color-foreground)]">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {calculateAge(student.dateOfBirth)} · {student.programType.replace(/_/g, ' ')}
                      </p>
                    </a>
                    {student.allergies.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {student.allergies.map((a) => (
                          <AllergyBadge key={a.allergen} allergen={a.allergen} severity={a.severity} />
                        ))}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setConfirmRemoveId(student.assignmentId)}
                      className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-md text-[var(--color-muted-foreground)] opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100 hover:bg-[var(--color-destructive)]/10 hover:text-[var(--color-destructive)]"
                      aria-label={`Remove ${student.firstName}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 6 6 18" /><path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assign Student Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogOverlay onClick={() => setDialogOpen(false)} />
        <DialogContent title="Assign Student" description="Add a student to this classroom's roster.">
          <DialogClose onClick={() => setDialogOpen(false)} />
          <form onSubmit={(e) => { e.preventDefault(); handleAssign() }} className="space-y-4">
            {serverError && (
              <div className="rounded-lg border border-[var(--color-destructive)]/30 bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-destructive)]">
                {serverError}
              </div>
            )}
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Student *</label>
              <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                {unassigned.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-[var(--color-foreground)]">Program Type</label>
              <Select value={programType} onChange={(e) => setProgramType(e.target.value)}>
                <option value="full_day">Full Day</option>
                <option value="half_day_am">Half Day (AM)</option>
                <option value="half_day_pm">Half Day (PM)</option>
                <option value="before_care">Before Care</option>
                <option value="after_care">After Care</option>
                <option value="summer">Summer</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button type="submit" size="sm" loading={isPending}>Assign</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Confirm Remove Dialog */}
      <Dialog open={!!confirmRemoveId} onOpenChange={() => setConfirmRemoveId(null)}>
        <DialogOverlay onClick={() => setConfirmRemoveId(null)} />
        <DialogContent title="Remove from Classroom">
          <DialogClose onClick={() => setConfirmRemoveId(null)} />
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Remove{' '}
            <strong className="text-[var(--color-foreground)]">
              {roster.find((r) => r.assignmentId === confirmRemoveId)?.firstName}{' '}
              {roster.find((r) => r.assignmentId === confirmRemoveId)?.lastName}
            </strong>
            {' '}from this classroom? They can be reassigned later.
          </p>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={() => setConfirmRemoveId(null)}>Cancel</Button>
            <Button type="button" variant="danger" size="sm" loading={isPending} onClick={() => confirmRemoveId && handleRemove(confirmRemoveId)}>
              Remove
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
