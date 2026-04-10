'use client'

// @anchor: cca.checkin.checkout-flow
// Check-out flow: select student, verify pickup person, confirm.
// Unauthorized pickup shows RED ALERT screen.
// See CCA_BUILD_BRIEF.md §7

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import { AlertTriangle, ArrowLeft, Check, Shield, ShieldAlert, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { performCheckOut, type CheckOutResult } from '@/lib/actions/check-in/check-out'
import { PickupVerification } from './pickup-verification'

interface CheckedInStudent {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  classroom_name: string | null
  check_in_time: string
}

interface CheckOutFlowProps {
  students: CheckedInStudent[]
  className?: string
}

type FlowStep = 'select_student' | 'enter_pickup' | 'verify_pickup' | 'success' | 'unauthorized'

export function CheckOutFlow({ students, className }: CheckOutFlowProps) {
  const [step, setStep] = useState<FlowStep>('select_student')
  const [selectedStudent, setSelectedStudent] = useState<CheckedInStudent | null>(null)
  const [pickupName, setPickupName] = useState('')
  const [pickupRelationship, setPickupRelationship] = useState('')
  const [idVerified, setIdVerified] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<CheckOutResult | null>(null)

  const displayName = (s: CheckedInStudent) =>
    s.preferred_name ?? s.first_name

  const handleSelectStudent = (student: CheckedInStudent) => {
    setSelectedStudent(student)
    setStep('enter_pickup')
  }

  const handleSubmitPickup = useCallback(async () => {
    if (!selectedStudent || !pickupName.trim() || !pickupRelationship.trim()) return
    setLoading(true)

    const res = await performCheckOut({
      student_id: selectedStudent.id,
      pickup_person_name: pickupName.trim(),
      pickup_person_relationship: pickupRelationship.trim(),
      method: 'staff_manual',
      photo_match_verified: idVerified,
    })

    setResult(res)
    setLoading(false)

    if (res.success) {
      setStep('success')
    } else if (res.pickup_authorized === false) {
      setStep('unauthorized')
    }
  }, [selectedStudent, pickupName, pickupRelationship, idVerified])

  const handleReset = () => {
    setStep('select_student')
    setSelectedStudent(null)
    setPickupName('')
    setPickupRelationship('')
    setIdVerified(false)
    setResult(null)
  }

  // ── Select student ─────────────────────────────────────────────────────
  if (step === 'select_student') {
    return (
      <div className={cn('flex flex-col gap-4', className)}>
        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          Check Out
        </h2>
        <p className="text-[var(--color-muted-foreground)]">
          Select a student to check out
        </p>

        {students.length === 0 ? (
          <p className="py-8 text-center text-[var(--color-muted-foreground)]">
            No students currently checked in.
          </p>
        ) : (
          <div className="flex flex-col gap-2">
            {students.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelectStudent(s)}
                className={cn(
                  'flex items-center gap-4 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4',
                  'text-left transition-colors hover:bg-[var(--color-muted)]',
                  'min-h-[56px]',
                )}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-primary)]/10">
                  <User className="h-5 w-5 text-[var(--color-primary)]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-[var(--color-foreground)]">
                    {displayName(s)} {s.last_name}
                  </p>
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    {s.classroom_name ?? 'Unassigned'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Enter pickup person ────────────────────────────────────────────────
  if (step === 'enter_pickup' && selectedStudent) {
    return (
      <div className={cn('flex flex-col gap-5', className)}>
        <button
          type="button"
          onClick={() => setStep('select_student')}
          className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] min-h-[48px] self-start"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <h2 className="text-xl font-bold text-[var(--color-foreground)]">
          Check Out: {displayName(selectedStudent)}
        </h2>

        <div>
          <label
            htmlFor="pickup-name"
            className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
          >
            Pickup person name
          </label>
          <input
            id="pickup-name"
            type="text"
            value={pickupName}
            onChange={(e) => setPickupName(e.target.value)}
            className={cn(
              'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3',
              'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
              'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
            )}
            placeholder="Full name of person picking up"
          />
        </div>

        <div>
          <label
            htmlFor="pickup-relationship"
            className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]"
          >
            Relationship to student
          </label>
          <input
            id="pickup-relationship"
            type="text"
            value={pickupRelationship}
            onChange={(e) => setPickupRelationship(e.target.value)}
            className={cn(
              'w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3',
              'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
              'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
            )}
            placeholder="Mother, Father, Grandparent, etc."
          />
        </div>

        <PickupVerification
          idVerified={idVerified}
          onIdVerifiedChange={setIdVerified}
        />

        <Button
          variant="primary"
          size="lg"
          onClick={handleSubmitPickup}
          loading={loading}
          disabled={!pickupName.trim() || !pickupRelationship.trim()}
          className="w-full"
        >
          <Check className="h-5 w-5" />
          Confirm Check Out
        </Button>
      </div>
    )
  }

  // ── Success ────────────────────────────────────────────────────────────
  if (step === 'success' && result?.success) {
    return (
      <div className={cn('flex flex-col items-center gap-6 py-12 text-center', className)}>
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-success)]/15">
          <Check className="h-10 w-10 text-[var(--color-success)]" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-[var(--color-foreground)]">
            {result.student_name} checked out!
          </h2>
          <p className="mt-2 text-[var(--color-muted-foreground)]">
            Picked up by {result.pickup_person_name}
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            See you tomorrow!
          </p>
        </div>
        <Button variant="secondary" size="lg" onClick={handleReset}>
          Check Out Another Student
        </Button>
      </div>
    )
  }

  // ── Unauthorized pickup — RED ALERT ────────────────────────────────────
  if (step === 'unauthorized') {
    return (
      <div
        className={cn(
          'flex flex-col items-center gap-6 rounded-[var(--radius,0.75rem)] border-4 border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 p-8 text-center',
          className,
        )}
        role="alert"
        aria-live="assertive"
      >
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[var(--color-destructive)]/20">
          <ShieldAlert className="h-12 w-12 text-[var(--color-destructive)]" />
        </div>

        <div>
          <h2 className="text-2xl font-bold text-[var(--color-destructive)]">
            PICKUP NOT AUTHORIZED
          </h2>
          <p className="mt-3 text-lg font-semibold text-[var(--color-foreground)]">
            {result?.pickup_person_name} is not authorized to pick up{' '}
            {result?.student_name}.
          </p>
          {result?.unauthorized_reason && (
            <p className="mt-2 text-[var(--color-muted-foreground)]">
              {result.unauthorized_reason}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg bg-[var(--color-destructive)]/5 p-3 text-sm text-[var(--color-foreground)]">
          <Shield className="h-5 w-5 text-[var(--color-destructive)]" />
          <span>Admin has been notified. Do not release this child.</span>
        </div>

        <Button variant="secondary" size="lg" onClick={handleReset}>
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    )
  }

  return null
}
