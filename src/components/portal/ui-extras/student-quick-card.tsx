'use client'

// @anchor: cca.ui.student-quick-card
// Hover/popup quick view of a student.
// Shows photo, age, classroom, allergies, emergency contacts, family contact.
// No page navigation needed — surfaces at any student name in the system.

import { useState, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { AllergyBadge, type AllergySeverity } from '@/components/portal/students/allergy-badge'
import { Badge } from '@/components/ui/badge'

export interface StudentQuickData {
  id: string
  first_name: string
  last_name: string
  preferred_name?: string | null
  date_of_birth: string
  photo_path?: string | null
  enrollment_status: string
  classroom_name?: string | null
  allergies: Array<{ allergen: string; severity: AllergySeverity }>
  emergency_contacts: Array<{
    name: string
    relationship: string
    phone: string
  }>
  family_contact?: {
    name: string
    phone: string
    email?: string
  } | null
}

export interface StudentQuickCardProps {
  student: StudentQuickData
  children: ReactNode
  className?: string
}

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months} months`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years} years`
}

export function StudentQuickCard({
  student,
  children,
  className,
}: StudentQuickCardProps) {
  const [show, setShow] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  const handleMouseEnter = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShow(true), 300)
  }

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setShow(false), 200)
  }

  const displayName = student.preferred_name || student.first_name
  const initials = `${student.first_name[0]}${student.last_name[0]}`.toUpperCase()
  const age = calculateAge(student.date_of_birth)
  const hasLifeThreatening = student.allergies.some(
    (a) => a.severity === 'life_threatening',
  )

  return (
    <div
      className={cn('relative inline-block', className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      {show && (
        <div
          className="absolute left-0 top-full z-50 mt-1 w-72 rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card)] p-4 shadow-lg"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          role="tooltip"
        >
          {/* Header */}
          <div className="flex items-start gap-3">
            {student.photo_path ? (
              <img
                src={student.photo_path}
                alt={`${displayName} ${student.last_name}`}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)] text-sm font-semibold text-[var(--color-muted-foreground)]">
                {initials}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                {displayName} {student.last_name}
              </p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                {age}
                {student.classroom_name && ` · ${student.classroom_name}`}
              </p>
              <Badge
                variant={student.enrollment_status === 'active' ? 'success' : 'outline'}
                size="sm"
                className="mt-1"
              >
                {student.enrollment_status}
              </Badge>
            </div>
          </div>

          {/* Allergies */}
          {student.allergies.length > 0 && (
            <div className={cn('mt-3 rounded-lg p-2', hasLifeThreatening ? 'bg-red-50' : 'bg-[var(--color-muted)]/50')}>
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Allergies
              </p>
              <div className="flex flex-wrap gap-1">
                {student.allergies.map((a) => (
                  <AllergyBadge
                    key={a.allergen}
                    allergen={a.allergen}
                    severity={a.severity}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Emergency contacts */}
          {student.emergency_contacts.length > 0 && (
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Emergency Contact
              </p>
              {student.emergency_contacts.slice(0, 2).map((ec, idx) => (
                <div key={idx} className="text-xs text-[var(--color-foreground)]">
                  <span className="font-medium">{ec.name}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {' '}
                    ({ec.relationship}) · {ec.phone}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Family contact */}
          {student.family_contact && (
            <div className="mt-3">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
                Family Contact
              </p>
              <div className="text-xs text-[var(--color-foreground)]">
                <span className="font-medium">{student.family_contact.name}</span>
                <span className="text-[var(--color-muted-foreground)]">
                  {' '}· {student.family_contact.phone}
                </span>
              </div>
            </div>
          )}

          {/* View profile link */}
          <a
            href={`/portal/admin/students/${student.id}`}
            className="mt-3 block text-center text-xs font-medium text-[var(--color-primary)] hover:underline"
          >
            View full profile
          </a>
        </div>
      )}
    </div>
  )
}
