'use client'

// @anchor: cca.student.list-client
// Client-side search filter over server-fetched student data.

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { AllergyBadge } from '@/components/portal/students/allergy-badge'
import type { AllergySeverity } from '@/components/portal/students/allergy-badge'

const statusVariant: Record<string, 'success' | 'warning' | 'default' | 'danger' | 'outline'> = {
  active: 'success',
  enrolled: 'default',
  applied: 'outline',
  waitlisted: 'warning',
  withdrawn: 'danger',
  graduated: 'outline',
}

function calculateAge(dob: string): string {
  const birth = new Date(dob)
  const now = new Date()
  const months =
    (now.getFullYear() - birth.getFullYear()) * 12 +
    (now.getMonth() - birth.getMonth())
  if (months < 24) return `${months}mo`
  const years = Math.floor(months / 12)
  const rem = months % 12
  return rem > 0 ? `${years}y ${rem}mo` : `${years}y`
}

export interface StudentRow {
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  date_of_birth: string
  enrollment_status: string
  photo_path: string | null
}

export interface StudentListClientProps {
  students: StudentRow[]
  allergyMap: Record<string, Array<{ allergen: string; severity: AllergySeverity }>>
  classroomMap: Record<string, string>
  serverQuery?: string
}

export function StudentListClient({
  students,
  allergyMap,
  classroomMap,
  serverQuery,
}: StudentListClientProps) {
  const [filterQuery, setFilterQuery] = useState('')

  const q = filterQuery.toLowerCase().trim()
  const filtered = q
    ? students.filter(
        (s) =>
          s.first_name.toLowerCase().includes(q) ||
          s.last_name.toLowerCase().includes(q) ||
          (s.preferred_name && s.preferred_name.toLowerCase().includes(q)),
      )
    : students

  return (
    <>
      {/* Client-side search input */}
      <div className="relative max-w-md">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <Input
          type="search"
          inputSize="sm"
          value={filterQuery}
          onChange={(e) => setFilterQuery(e.target.value)}
          placeholder="Filter students..."
          className="pl-10"
        />
      </div>

      {/* Count */}
      <p className="text-sm text-[var(--color-muted-foreground)]">
        {filtered.length} of {students.length} student{students.length !== 1 ? 's' : ''}{' '}
        {filterQuery && `matching "${filterQuery}"`}
      </p>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Age</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Classroom</TableHead>
            <TableHead>Allergies</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center text-[var(--color-muted-foreground)]"
              >
                {filterQuery
                  ? `No students matching "${filterQuery}"`
                  : serverQuery
                    ? `No students matching "${serverQuery}"`
                    : 'No students found'}
              </TableCell>
            </TableRow>
          ) : (
            filtered.map((student) => {
              const studentAllergies = allergyMap[student.id] ?? []
              const classroomName = classroomMap[student.id]
              return (
                <TableRow key={student.id}>
                  <TableCell>
                    <Link
                      href={`/portal/admin/students/${student.id}`}
                      className="flex items-center gap-3 hover:underline"
                    >
                      {student.photo_path ? (
                        <img
                          src={student.photo_path}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--color-muted)] text-xs font-semibold text-[var(--color-muted-foreground)]">
                          {student.first_name[0]}
                          {student.last_name[0]}
                        </div>
                      )}
                      <span className="font-medium text-[var(--color-foreground)]">
                        {student.preferred_name || student.first_name} {student.last_name}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                    {calculateAge(student.date_of_birth)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusVariant[student.enrollment_status] || 'outline'}
                      size="sm"
                    >
                      {student.enrollment_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                    {classroomName || '\u2014'}
                  </TableCell>
                  <TableCell>
                    {studentAllergies.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {studentAllergies.map((a) => (
                          <AllergyBadge
                            key={a.allergen}
                            allergen={a.allergen}
                            severity={a.severity}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        None
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </>
  )
}
