'use client'

// @anchor: cca.checkin.parent-qr-display
// Client wrapper for parent QR code display.
// Fetches QR data on mount and renders the QRScanner component.

import { useEffect, useState } from 'react'
import { QRScanner, type QRStudent } from '@/components/portal/check-in/qr-scanner'
import { Spinner } from '@/components/ui/spinner'

export function ParentQRDisplay() {
  const [students, setStudents] = useState<QRStudent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // TODO: Replace with real Supabase query using the authenticated parent's session.
    // Query: student_qr_codes JOIN students JOIN student_classroom_assignments JOIN classrooms
    // WHERE family_id = parent's family AND qr_token is active (not expired/revoked)
    const fetchStudents = async () => {
      try {
        // Placeholder data for build verification — removed once auth is wired
        setStudents([
          {
            student_id: 'placeholder-1',
            student_name: 'Sophia Martinez',
            qr_token: 'cca-checkin-sophia-placeholder-token-001',
            classroom_name: 'Butterfly Room',
            photo_path: null,
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Spinner size="lg" label="Loading check-in codes" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">
          Check-In
        </h1>
        <p className="mt-1 text-[var(--color-muted-foreground)]">
          Show this QR code to staff at drop-off
        </p>
      </div>

      <QRScanner students={students} />
    </div>
  )
}
