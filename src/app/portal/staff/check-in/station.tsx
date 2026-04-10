'use client'

// @anchor: cca.checkin.staff-station
// Client component orchestrating the full check-in flow.
// Tab interface: QR Scan | PIN Entry | Manual
// Flow: identify student -> health screen -> allergy ack -> confirm

import { useCallback, useState } from 'react'
import { cn } from '@/lib/cn'
import { Tabs, TabList, Tab, TabPanel } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { PinPad } from '@/components/portal/check-in/pin-pad'
import { HealthScreening } from '@/components/portal/check-in/health-screening'
import { AllergyBanner, type AllergyInfo } from '@/components/portal/check-in/allergy-banner'
import { CheckInConfirmation } from '@/components/portal/check-in/check-in-confirmation'
import { CheckOutFlow } from '@/components/portal/check-in/check-out-flow'
import { performCheckIn, type CheckInResult } from '@/lib/actions/check-in/check-in'
import type { HealthScreening as HealthScreeningData } from '@/lib/schemas/check-in'
import { QrCode, Hash, UserCheck, LogOut, Search } from 'lucide-react'

type FlowStep = 'identify' | 'health_screen' | 'allergy_ack' | 'confirmed' | 'checkout'

interface StudentMatch {
  student_id: string
  student_name: string
  classroom_name: string | null
}

export function StaffCheckInStation() {
  const [step, setStep] = useState<FlowStep>('identify')
  const [student, setStudent] = useState<StudentMatch | null>(null)
  const [healthData, setHealthData] = useState<HealthScreeningData | null>(null)
  const [allergies, setAllergies] = useState<AllergyInfo[]>([])
  const [result, setResult] = useState<CheckInResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualStudentId, setManualStudentId] = useState('')
  const [mode, setMode] = useState<'checkin' | 'checkout'>('checkin')

  // ── Reset flow ─────────────────────────────────────────────────────────
  const resetFlow = useCallback(() => {
    setStep('identify')
    setStudent(null)
    setHealthData(null)
    setAllergies([])
    setResult(null)
    setLoading(false)
    setError(null)
    setManualStudentId('')
  }, [])

  // ── Handle PIN submit (lookup student by PIN) ──────────────────────────
  const handlePinSubmit = useCallback(async (pin: string) => {
    setLoading(true)
    setError(null)
    // TODO: Look up student by family PIN in student_qr_codes or a pin table
    // For now, simulate a lookup — in production this would query Supabase
    setStudent({
      student_id: pin,
      student_name: 'Student',
      classroom_name: null,
    })
    setStep('health_screen')
    setLoading(false)
  }, [])

  // ── Handle manual student ID ───────────────────────────────────────────
  const handleManualSubmit = useCallback(() => {
    if (!manualStudentId.trim()) return
    setStudent({
      student_id: manualStudentId.trim(),
      student_name: 'Student',
      classroom_name: null,
    })
    setStep('health_screen')
  }, [manualStudentId])

  // ── Handle health screening complete ───────────────────────────────────
  const handleHealthComplete = useCallback(
    async (screening: HealthScreeningData) => {
      setHealthData(screening)

      if (!student) return

      // Try a preliminary check-in (without allergy ack) to see if allergies require ack
      setLoading(true)
      const res = await performCheckIn({
        student_id: student.student_id,
        method: 'staff_manual',
        health_screening: screening,
        allergy_acknowledged: false,
      })

      if (res.requires_allergy_acknowledgment && res.allergies) {
        setAllergies(res.allergies)
        setResult(res)
        setStep('allergy_ack')
        setLoading(false)
        return
      }

      if (res.success) {
        setResult(res)
        setStep('confirmed')
        setLoading(false)
        return
      }

      setError(res.error ?? 'Check-in failed.')
      setLoading(false)
    },
    [student],
  )

  // ── Handle allergy acknowledgment ──────────────────────────────────────
  const handleAllergyAck = useCallback(async () => {
    if (!student || !healthData) return
    setLoading(true)

    const res = await performCheckIn({
      student_id: student.student_id,
      method: 'staff_manual',
      health_screening: healthData,
      allergy_acknowledged: true,
    })

    if (res.success) {
      setResult(res)
      setStep('confirmed')
    } else {
      setError(res.error ?? 'Check-in failed.')
    }
    setLoading(false)
  }, [student, healthData])

  // ── Check-out mode ─────────────────────────────────────────────────────
  if (mode === 'checkout') {
    return (
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setMode('checkin')}
            className="text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] min-h-[48px]"
          >
            Switch to Check In
          </button>
        </div>
        <CheckOutFlow students={[]} />
      </div>
    )
  }

  // ── Confirmed step ─────────────────────────────────────────────────────
  if (step === 'confirmed' && result?.success) {
    return (
      <CheckInConfirmation
        studentName={result.student_name ?? 'Student'}
        classroomName={result.classroom_name}
        onDismiss={resetFlow}
      />
    )
  }

  // ── Allergy acknowledgment step ────────────────────────────────────────
  if (step === 'allergy_ack') {
    return (
      <div className="flex flex-col gap-6">
        <AllergyBanner
          studentName={result?.student_name ?? student?.student_name ?? 'Student'}
          allergies={allergies}
        />

        <Button
          variant="danger"
          size="lg"
          onClick={handleAllergyAck}
          loading={loading}
          className="w-full"
        >
          <UserCheck className="h-5 w-5" />
          I Acknowledge — Proceed with Check-In
        </Button>

        <Button variant="secondary" size="lg" onClick={resetFlow} className="w-full">
          Cancel
        </Button>
      </div>
    )
  }

  // ── Health screening step ──────────────────────────────────────────────
  if (step === 'health_screen' && student) {
    return (
      <HealthScreening
        studentName={student.student_name}
        onComplete={handleHealthComplete}
        onCancel={resetFlow}
      />
    )
  }

  // ── Identify student step (default) ────────────────────────────────────
  return (
    <div className="flex flex-col gap-6">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Check-In Station
        </h1>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMode('checkout')}
        >
          <LogOut className="h-4 w-4" />
          Check Out
        </Button>
      </div>

      {error && (
        <div className="rounded-[var(--radius,0.75rem)] border border-[var(--color-destructive)] bg-[var(--color-destructive)]/10 p-4 text-sm text-[var(--color-destructive)]" role="alert">
          {error}
        </div>
      )}

      <Tabs defaultValue="pin">
        <TabList>
          <Tab value="qr">
            <span className="flex items-center gap-2">
              <QrCode className="h-4 w-4" />
              QR Scan
            </span>
          </Tab>
          <Tab value="pin">
            <span className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              PIN Entry
            </span>
          </Tab>
          <Tab value="manual">
            <span className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Manual
            </span>
          </Tab>
        </TabList>

        {/* QR Scan tab */}
        <TabPanel value="qr">
          <div className="flex flex-col items-center gap-4 py-8">
            <div className="flex h-48 w-48 items-center justify-center rounded-[var(--radius,0.75rem)] border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]">
              <QrCode className="h-16 w-16 text-[var(--color-muted-foreground)]" />
            </div>
            <p className="text-center text-[var(--color-muted-foreground)]">
              Point camera at the parent&apos;s QR code
            </p>
            <p className="text-center text-sm text-[var(--color-muted-foreground)]">
              Camera-based QR scanning requires a connected scanner device.
              Use PIN entry or manual lookup as alternatives.
            </p>
          </div>
        </TabPanel>

        {/* PIN Entry tab */}
        <TabPanel value="pin">
          <div className="flex flex-col items-center gap-4 py-6">
            <p className="text-center text-[var(--color-muted-foreground)]">
              Enter the family&apos;s 6-digit PIN
            </p>
            <PinPad
              onSubmit={handlePinSubmit}
              loading={loading}
              error={error}
            />
          </div>
        </TabPanel>

        {/* Manual lookup tab */}
        <TabPanel value="manual">
          <div className="flex flex-col gap-4 py-6">
            <p className="text-[var(--color-muted-foreground)]">
              Search for a student by name or ID
            </p>
            <div className="flex gap-3">
              <input
                type="text"
                value={manualStudentId}
                onChange={(e) => setManualStudentId(e.target.value)}
                placeholder="Student name or ID"
                className={cn(
                  'flex-1 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] px-4 py-3',
                  'text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)]',
                  'focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20',
                )}
              />
              <Button
                variant="primary"
                onClick={handleManualSubmit}
                disabled={!manualStudentId.trim()}
              >
                Look Up
              </Button>
            </div>
          </div>
        </TabPanel>
      </Tabs>
    </div>
  )
}
