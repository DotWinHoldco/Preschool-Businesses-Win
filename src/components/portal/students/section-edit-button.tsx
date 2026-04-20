'use client'

// @anchor: cca.student.section-edit-button
// Client component: pencil icon button + dialog trigger for student section editing.
// Used by the Server Component student detail page to add edit capabilities.

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  StudentEditDialog,
  type EditSection,
  type StudentOverviewData,
  type ClassroomOption,
  type MedicalData,
  type AllergyItem,
} from './student-edit-dialog'

// Pencil icon (inline SVG to avoid extra deps)
function PencilIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
      <path d="m15 5 4 4" />
    </svg>
  )
}

export interface SectionEditButtonProps {
  section: EditSection
  studentId: string
  overview?: StudentOverviewData
  classrooms?: ClassroomOption[]
  currentClassroomId?: string | null
  medical?: MedicalData
  allergies?: AllergyItem[]
}

export function SectionEditButton({
  section,
  studentId,
  overview,
  classrooms,
  currentClassroomId,
  medical,
  allergies,
}: SectionEditButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 w-7 min-h-0 min-w-0 p-0 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        onClick={() => setOpen(true)}
        aria-label={`Edit ${section}`}
      >
        <PencilIcon />
      </Button>
      <StudentEditDialog
        open={open}
        onOpenChange={setOpen}
        section={section}
        studentId={studentId}
        overview={overview}
        classrooms={classrooms}
        currentClassroomId={currentClassroomId}
        medical={medical}
        allergies={allergies}
      />
    </>
  )
}
