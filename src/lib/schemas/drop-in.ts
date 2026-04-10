// @anchor: cca.dropin.schemas
// Zod schemas for drop-in scheduling: availability, bookings
// See CCA_BUILD_BRIEF.md §31

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Drop-in availability status
// ---------------------------------------------------------------------------

export const DropInAvailabilityStatusSchema = z.enum(['open', 'full', 'closed'])
export type DropInAvailabilityStatus = z.infer<typeof DropInAvailabilityStatusSchema>

// ---------------------------------------------------------------------------
// Booking type
// ---------------------------------------------------------------------------

export const DropInBookingTypeSchema = z.enum([
  'full_day',
  'half_day_am',
  'half_day_pm',
])
export type DropInBookingType = z.infer<typeof DropInBookingTypeSchema>

// ---------------------------------------------------------------------------
// Booking status
// ---------------------------------------------------------------------------

export const DropInBookingStatusSchema = z.enum([
  'confirmed',
  'cancelled',
  'completed',
  'no_show',
])
export type DropInBookingStatus = z.infer<typeof DropInBookingStatusSchema>

// ---------------------------------------------------------------------------
// Manage availability
// ---------------------------------------------------------------------------

export const ManageDropInAvailabilitySchema = z.object({
  classroom_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  slots_total: z.number().int().min(0).max(50),
  rate_cents: z.number().int().min(0),
  half_day_rate_cents: z.number().int().min(0).optional(),
  status: DropInAvailabilityStatusSchema.default('open'),
})
export type ManageDropInAvailabilityInput = z.infer<typeof ManageDropInAvailabilitySchema>

// ---------------------------------------------------------------------------
// Book drop-in
// ---------------------------------------------------------------------------

export const BookDropInSchema = z.object({
  student_id: z.string().uuid(),
  family_id: z.string().uuid(),
  classroom_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  booking_type: DropInBookingTypeSchema,
  notes: z.string().max(500).optional(),
})
export type BookDropInInput = z.infer<typeof BookDropInSchema>

// ---------------------------------------------------------------------------
// Cancel booking
// ---------------------------------------------------------------------------

export const CancelDropInSchema = z.object({
  booking_id: z.string().uuid(),
  cancel_reason: z.string().min(1).max(500),
})
export type CancelDropInInput = z.infer<typeof CancelDropInSchema>
