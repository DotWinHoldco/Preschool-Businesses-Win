// @anchor: cca.checkin.schemas
// Zod schemas for check-in/check-out, health screening, QR scan
// See CCA_BUILD_BRIEF.md §7

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Check-in method
// ---------------------------------------------------------------------------

export const CheckInMethodSchema = z.enum([
  'qr_scan',
  'pin',
  'staff_manual',
  'kiosk',
])
export type CheckInMethod = z.infer<typeof CheckInMethodSchema>

// ---------------------------------------------------------------------------
// Health screening
// ---------------------------------------------------------------------------

export const HealthScreeningSchema = z.object({
  has_fever: z.boolean(),
  has_rash: z.boolean(),
  has_vomiting: z.boolean(),
  has_diarrhea: z.boolean(),
  notes: z.string().max(500).optional(),
})
export type HealthScreening = z.infer<typeof HealthScreeningSchema>

// ---------------------------------------------------------------------------
// Check-in request
// ---------------------------------------------------------------------------

export const CheckInSchema = z.object({
  student_id: z.string().uuid(),
  method: CheckInMethodSchema,
  health_screening: HealthScreeningSchema,
  allergy_acknowledged: z.boolean().optional(),
  temperature_f: z.number().min(90).max(110).optional(),
  notes: z.string().max(1000).optional(),
})
export type CheckInInput = z.infer<typeof CheckInSchema>

// ---------------------------------------------------------------------------
// Check-out request
// ---------------------------------------------------------------------------

export const CheckOutSchema = z.object({
  student_id: z.string().uuid(),
  pickup_person_name: z.string().min(1).max(200),
  pickup_person_relationship: z.string().min(1).max(100),
  pickup_person_user_id: z.string().uuid().optional(),
  method: CheckInMethodSchema,
  photo_match_verified: z.boolean().optional(),
  staff_override: z.boolean().optional(),
  staff_override_reason: z.string().max(500).optional(),
  notes: z.string().max(1000).optional(),
})
export type CheckOutInput = z.infer<typeof CheckOutSchema>

// ---------------------------------------------------------------------------
// QR scan
// ---------------------------------------------------------------------------

export const QRScanSchema = z.object({
  qr_token: z.string().min(1).max(500),
})
export type QRScanInput = z.infer<typeof QRScanSchema>

// ---------------------------------------------------------------------------
// PIN entry
// ---------------------------------------------------------------------------

export const PINEntrySchema = z.object({
  pin: z.string().length(6).regex(/^\d{6}$/, 'PIN must be exactly 6 digits'),
})
export type PINEntryInput = z.infer<typeof PINEntrySchema>

// ---------------------------------------------------------------------------
// Pickup verification request
// ---------------------------------------------------------------------------

export const VerifyPickupSchema = z.object({
  student_id: z.string().uuid(),
  pickup_person_name: z.string().min(1).max(200),
  family_id: z.string().uuid().optional(),
})
export type VerifyPickupInput = z.infer<typeof VerifyPickupSchema>

// ---------------------------------------------------------------------------
// Carline queue entry
// ---------------------------------------------------------------------------

export const CarlineArrivalSchema = z.object({
  family_id: z.string().uuid(),
  pickup_person_name: z.string().min(1).max(200),
  pickup_person_user_id: z.string().uuid().optional(),
  student_ids: z.array(z.string().uuid()).min(1),
  notes: z.string().max(500).optional(),
})
export type CarlineArrivalInput = z.infer<typeof CarlineArrivalSchema>

export const CarlineReleaseSchema = z.object({
  queue_entry_id: z.string().uuid(),
  student_id: z.string().uuid(),
})
export type CarlineReleaseInput = z.infer<typeof CarlineReleaseSchema>
