// @anchor: cca.staff.schema
// Zod schemas for staff management, time tracking, PTO, and certifications.
// Matches staff_profiles, time_entries, pto_requests, staff_certifications tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Employment type enum
// ---------------------------------------------------------------------------

export const employmentTypeEnum = z.enum(['full_time', 'part_time', 'substitute'])
export type EmploymentType = z.infer<typeof employmentTypeEnum>

// ---------------------------------------------------------------------------
// Clock in/out
// ---------------------------------------------------------------------------

export const clockInMethodEnum = z.enum(['app', 'kiosk', 'manual'])

export const ClockInSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  method: clockInMethodEnum.default('app'),
  notes: z.string().max(500).optional(),
})

export type ClockInInput = z.infer<typeof ClockInSchema>

export const ClockOutSchema = z.object({
  time_entry_id: z.string().uuid('Invalid time entry ID'),
  notes: z.string().max(500).optional(),
})

export type ClockOutInput = z.infer<typeof ClockOutSchema>

export const StartBreakSchema = z.object({
  time_entry_id: z.string().uuid('Invalid time entry ID'),
})

export const EndBreakSchema = z.object({
  time_entry_id: z.string().uuid('Invalid time entry ID'),
})

// ---------------------------------------------------------------------------
// Time entry status
// ---------------------------------------------------------------------------

export const timeEntryStatusEnum = z.enum([
  'active',
  'completed',
  'edited',
  'approved',
])

export type TimeEntryStatus = z.infer<typeof timeEntryStatusEnum>

// ---------------------------------------------------------------------------
// Certification types
// ---------------------------------------------------------------------------

export const certTypeEnum = z.enum([
  'cpr',
  'first_aid',
  'ece_credential',
  'food_handler',
  'other',
])

export const ManageCertificationSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  cert_type: certTypeEnum,
  cert_name: z.string().min(1, 'Certification name is required').max(200),
  issuing_body: z.string().min(1, 'Issuing body is required').max(200),
  issued_date: z.string().min(1, 'Issue date is required'),
  expiry_date: z.string().optional(),
  document_path: z.string().optional(),
})

export type ManageCertificationInput = z.infer<typeof ManageCertificationSchema>

// ---------------------------------------------------------------------------
// PTO
// ---------------------------------------------------------------------------

export const ptoTypeEnum = z.enum(['vacation', 'sick', 'personal'])
export const ptoRequestStatusEnum = z.enum(['pending', 'approved', 'denied'])

export const PTORequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  pto_type: ptoTypeEnum,
  start_date: z.string().min(1, 'Start date is required'),
  end_date: z.string().min(1, 'End date is required'),
  hours_requested: z.number().min(0.5, 'Must request at least 0.5 hours'),
  notes: z.string().max(2000).optional(),
})

export type PTORequestInput = z.infer<typeof PTORequestSchema>

// ---------------------------------------------------------------------------
// Schedule
// ---------------------------------------------------------------------------

export const dayOfWeekEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

export const ManageScheduleSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  entries: z.array(
    z.object({
      day_of_week: dayOfWeekEnum,
      start_time: z.string().min(1, 'Start time is required'),
      end_time: z.string().min(1, 'End time is required'),
      classroom_id: z.string().uuid('Invalid classroom ID'),
    })
  ).min(1, 'At least one schedule entry is required'),
  effective_from: z.string().min(1, 'Effective date is required'),
  effective_to: z.string().optional(),
})

export type ManageScheduleInput = z.infer<typeof ManageScheduleSchema>

// ---------------------------------------------------------------------------
// Payroll run
// ---------------------------------------------------------------------------

export const payrollRunStatusEnum = z.enum([
  'draft',
  'approved',
  'exported',
  'paid',
])

export const RunPayrollSchema = z.object({
  period_start: z.string().min(1, 'Period start is required'),
  period_end: z.string().min(1, 'Period end is required'),
})

export type RunPayrollInput = z.infer<typeof RunPayrollSchema>

// ---------------------------------------------------------------------------
// Staff profile
// ---------------------------------------------------------------------------

export const payFrequencyEnum = z.enum(['weekly', 'biweekly', 'monthly'])

export const StaffProfileSchema = z.object({
  user_id: z.string().uuid('Invalid user ID'),
  employee_id: z.string().max(50).optional(),
  hire_date: z.string().optional(),
  employment_type: employmentTypeEnum.default('full_time'),
  hourly_rate: z.number().min(0).optional(),
  salary: z.number().min(0).optional(),
  pay_frequency: payFrequencyEnum.default('biweekly'),
  emergency_contact_name: z.string().max(200).optional(),
  emergency_contact_phone: z.string().max(30).optional(),
  notes_internal: z.string().max(5000).optional(),
})

export type StaffProfileInput = z.infer<typeof StaffProfileSchema>
