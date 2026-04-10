'use client'

// @anchor: cca.checkin.pickup-verification
// Shows pickup person info, photo (if on file), ID verification toggle.
// See CCA_BUILD_BRIEF.md §7

import { cn } from '@/lib/cn'
import { Camera, CheckCircle, ShieldCheck, XCircle } from 'lucide-react'

interface PickupVerificationProps {
  personName?: string
  relationship?: string
  photoPath?: string | null
  authorized?: boolean
  idVerified: boolean
  onIdVerifiedChange: (verified: boolean) => void
  className?: string
}

export function PickupVerification({
  personName,
  relationship,
  photoPath,
  authorized,
  idVerified,
  onIdVerifiedChange,
  className,
}: PickupVerificationProps) {
  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Person info with photo */}
      {personName && (
        <div className="flex items-center gap-4 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          {photoPath ? (
            <img
              src={photoPath}
              alt={personName}
              className="h-14 w-14 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-muted)]">
              <Camera className="h-6 w-6 text-[var(--color-muted-foreground)]" />
            </div>
          )}

          <div className="flex-1">
            <p className="font-semibold text-[var(--color-foreground)]">{personName}</p>
            {relationship && (
              <p className="text-sm text-[var(--color-muted-foreground)]">{relationship}</p>
            )}
          </div>

          {authorized !== undefined && (
            <div>
              {authorized ? (
                <CheckCircle className="h-6 w-6 text-[var(--color-success)]" />
              ) : (
                <XCircle className="h-6 w-6 text-[var(--color-destructive)]" />
              )}
            </div>
          )}
        </div>
      )}

      {/* ID Verification toggle */}
      <button
        type="button"
        onClick={() => onIdVerifiedChange(!idVerified)}
        className={cn(
          'flex items-center gap-4 rounded-[var(--radius,0.75rem)] border-2 p-4 transition-colors',
          'min-h-[56px] text-left',
          idVerified
            ? 'border-[var(--color-success)] bg-[var(--color-success)]/10'
            : 'border-[var(--color-border)] bg-[var(--color-card)] hover:bg-[var(--color-muted)]',
        )}
        role="switch"
        aria-checked={idVerified}
        aria-label="Photo ID verified by staff"
      >
        <ShieldCheck
          className={cn(
            'h-6 w-6 shrink-0',
            idVerified ? 'text-[var(--color-success)]' : 'text-[var(--color-muted-foreground)]',
          )}
        />
        <div className="flex-1">
          <p className="font-medium text-[var(--color-foreground)]">
            Photo ID Verified
          </p>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Staff has verified government-issued photo ID
          </p>
        </div>
        <div
          className={cn(
            'flex h-8 w-14 items-center rounded-full px-1 transition-colors',
            idVerified ? 'justify-end bg-[var(--color-success)]' : 'justify-start bg-[var(--color-border)]',
          )}
        >
          <div className="h-6 w-6 rounded-full bg-white shadow-sm" />
        </div>
      </button>
    </div>
  )
}
