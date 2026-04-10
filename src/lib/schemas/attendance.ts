// @anchor: cca.attendance.schema
// Zod schemas for attendance records and amendments.
// Matches attendance_records and attendance_amendments tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Attendance status enum
// ---------------------------------------------------------------------------

export const attendanceStatusEnum = z.enum([
  'present',
  'absent',
  'late',
  'early_pickup',
  'excused_absent',
  'sick',
])

export type AttendanceStatus = z.infer<typeof attendanceStatusEnum>

// ---------------------------------------------------------------------------
// Record attendance
// ---------------------------------------------------------------------------

export const RecordAttendanceSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
  date: z.string().min(1, 'Date is required'),
  status: attendanceStatusEnum,
  check_in_id: z.string().uuid().optional(),
  check_out_id: z.string().uuid().optional(),
  hours_present: z.number().min(0).max(24).optional(),
  notes: z.string().max(2000).optional(),
})

export type RecordAttendanceInput = z.infer<typeof RecordAttendanceSchema>

// ---------------------------------------------------------------------------
// Finalize attendance
// ---------------------------------------------------------------------------

export const FinalizeAttendanceSchema = z.object({
  classroom_id: z.string().uuid('Invalid classroom ID'),
  date: z.string().min(1, 'Date is required'),
})

export type FinalizeAttendanceInput = z.infer<typeof FinalizeAttendanceSchema>

// ---------------------------------------------------------------------------
// Amend attendance
// ---------------------------------------------------------------------------

export const AmendAttendanceSchema = z.object({
  attendance_record_id: z.string().uuid('Invalid attendance record ID'),
  reason: z.string().min(1, 'Amendment reason is required').max(2000),
  new_status: attendanceStatusEnum.optional(),
  new_hours_present: z.number().min(0).max(24).optional(),
  new_notes: z.string().max(2000).optional(),
})

export type AmendAttendanceInput = z.infer<typeof AmendAttendanceSchema>
