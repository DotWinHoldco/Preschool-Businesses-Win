'use client'

// @anchor: cca.checkin.parent-qr-display
// Client wrapper for parent QR code display.
// Receives real student data as props from the server component.

import { QRScanner, type QRStudent } from '@/components/portal/check-in/qr-scanner'

interface ParentQRDisplayProps {
  students?: QRStudent[]
}

export function ParentQRDisplay({ students = [] }: ParentQRDisplayProps) {
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

      {students.length > 0 ? (
        <QRScanner students={students} />
      ) : (
        <div className="rounded-[var(--radius,0.75rem)] border border-dashed border-[var(--color-border)] p-8 text-center">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No children linked to your account for check-in.
          </p>
        </div>
      )}
    </div>
  )
}
