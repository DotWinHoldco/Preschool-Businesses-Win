// @anchor: cca.appointments.schema

import { z } from 'zod'

export const locationTypeEnum = z.enum(['in_person', 'virtual', 'phone'])
export const appointmentStatusEnum = z.enum([
  'pending',
  'confirmed',
  'cancelled_by_parent',
  'cancelled_by_staff',
  'rescheduled',
  'no_show',
  'completed',
])
export const calendarProviderEnum = z.enum(['google', 'outlook', 'apple'])

export const CreateAppointmentTypeSchema = z.object({
  name: z.string().min(1).max(200),
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'slug must be lowercase letters, numbers, and hyphens'),
  description: z.string().max(2000).optional(),
  duration_minutes: z.number().int().min(5).max(480),
  buffer_before_minutes: z.number().int().min(0).max(240).default(0),
  buffer_after_minutes: z.number().int().min(0).max(240).default(15),
  color: z.string().max(7).optional(),
  location: z.string().max(500).optional(),
  location_type: locationTypeEnum.default('in_person'),
  virtual_meeting_url: z.string().url().optional().or(z.literal('')),
  booking_window_days: z.number().int().min(1).max(365).default(30),
  min_notice_hours: z.number().int().min(0).max(720).default(24),
  max_per_day: z.number().int().min(1).optional().nullable(),
  max_per_slot: z.number().int().min(1).default(1),
  assigned_staff: z.array(z.string().uuid()).default([]),
  round_robin: z.boolean().default(false),
  require_confirmation: z.boolean().default(false),
  auto_confirm: z.boolean().default(true),
  confirmation_message: z.string().max(2000).optional(),
  reminder_hours: z.array(z.number().int().min(0)).default([24, 1]),
  linked_pipeline_stage: z.string().max(50).optional(),
  price_cents: z.number().int().min(0).optional().nullable(),
  is_active: z.boolean().default(true),
})
export type CreateAppointmentTypeInput = z.input<typeof CreateAppointmentTypeSchema>

export const UpdateAppointmentTypeSchema = CreateAppointmentTypeSchema.partial().extend({
  id: z.string().uuid(),
})
export type UpdateAppointmentTypeInput = z.infer<typeof UpdateAppointmentTypeSchema>

export const StaffAvailabilitySchema = z.object({
  user_id: z.string().uuid(),
  day_of_week: z.number().int().min(0).max(6),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM'),
  end_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Must be HH:MM'),
  appointment_type_id: z.string().uuid().optional().nullable(),
  effective_from: z.string().optional(),
  effective_to: z.string().optional().nullable(),
})
export type StaffAvailabilityInput = z.infer<typeof StaffAvailabilitySchema>

export const StaffAvailabilityOverrideSchema = z.object({
  user_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD'),
  is_available: z.boolean(),
  start_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  end_time: z
    .string()
    .regex(/^\d{2}:\d{2}(:\d{2})?$/)
    .optional(),
  reason: z.string().max(500).optional(),
})
export type StaffAvailabilityOverrideInput = z.infer<typeof StaffAvailabilityOverrideSchema>

export const BookAppointmentSchema = z.object({
  appointment_type_id: z.string().uuid(),
  start_at: z.string().datetime(),
  booked_by_name: z.string().min(1).max(200),
  booked_by_email: z.string().email(),
  booked_by_phone: z.string().max(30).optional(),
  timezone: z.string().max(100).default('America/Chicago'),
  notes: z.string().max(2000).optional(),
  application_id: z.string().uuid().optional(),
  staff_user_id: z.string().uuid().optional(),
  /** Honeypot — must be empty */
  website: z.string().max(0).optional().default(''),
})
export type BookAppointmentInput = z.infer<typeof BookAppointmentSchema>

export const CancelAppointmentSchema = z.object({
  id: z.string().uuid(),
  reason: z.string().max(1000).optional(),
  cancelled_by: z.enum(['parent', 'staff']).default('staff'),
})
export type CancelAppointmentInput = z.infer<typeof CancelAppointmentSchema>

export const RescheduleAppointmentSchema = z.object({
  id: z.string().uuid(),
  new_start_at: z.string().datetime(),
  reason: z.string().max(1000).optional(),
})
export type RescheduleAppointmentInput = z.infer<typeof RescheduleAppointmentSchema>

export const UpdateAppointmentNotesSchema = z.object({
  id: z.string().uuid(),
  staff_notes: z.string().max(5000),
})
export type UpdateAppointmentNotesInput = z.infer<typeof UpdateAppointmentNotesSchema>

export const ListAppointmentsSchema = z.object({
  status: z.array(appointmentStatusEnum).optional(),
  appointment_type_id: z.string().uuid().optional(),
  staff_user_id: z.string().uuid().optional(),
  date_from: z.string().optional(),
  date_to: z.string().optional(),
  search: z.string().max(200).optional(),
  page: z.number().int().min(1).default(1),
  per_page: z.number().int().min(1).max(100).default(25),
})
export type ListAppointmentsInput = z.infer<typeof ListAppointmentsSchema>

export const PipelineActionSchema = z.object({
  application_id: z.string().uuid(),
  action: z.enum([
    'accept_and_invite_interview',
    'mark_interview_complete',
    'send_offer',
    'accept_offer',
    'request_info',
    'waitlist',
    'reject',
    'withdraw',
  ]),
  notes: z.string().max(5000).optional(),
  assigned_staff_id: z.string().uuid().optional(),
})
export type PipelineActionInput = z.infer<typeof PipelineActionSchema>
