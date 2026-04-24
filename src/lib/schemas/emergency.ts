// @anchor: cca.emergency.schema
// Zod schemas for emergencies, drills, muster points, contacts.

import { z } from 'zod'

// -- Initiate / resolve emergency -------------------------------------------

export const InitiateEmergencySchema = z.object({
  event_type: z.enum([
    'lockdown',
    'shelter_in_place',
    'evacuation',
    'medical',
    'weather',
    'drill',
    'other',
  ]),
  severity: z.enum(['drill', 'advisory', 'critical']),
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional().nullable(),
  channels: z.array(z.string()).default([]),
})
export type InitiateEmergencyInput = z.infer<typeof InitiateEmergencySchema>

export const ResolveEmergencySchema = z.object({
  event_id: z.string().uuid(),
  all_clear_message: z.string().min(1).max(2000),
  notes: z.string().max(2000).optional().nullable(),
})
export type ResolveEmergencyInput = z.infer<typeof ResolveEmergencySchema>

// -- Drills -----------------------------------------------------------------

export const DrillTypeEnum = z.enum([
  'fire',
  'lockdown',
  'shelter_in_place',
  'evacuation',
  'severe_weather',
  'earthquake',
])
export type DrillType = z.infer<typeof DrillTypeEnum>

export const ScheduleDrillSchema = z.object({
  drill_type: DrillTypeEnum,
  scheduled_at: z.string().min(1),
  notes: z.string().max(2000).optional().nullable(),
  muster_point_id: z.string().uuid().optional().nullable(),
})
export type ScheduleDrillInput = z.infer<typeof ScheduleDrillSchema>

export const CompleteDrillSchema = z.object({
  id: z.string().uuid(),
  duration_seconds: z.number().int().nonnegative().optional(),
  participants_count: z.number().int().nonnegative().optional(),
  students_count: z.number().int().nonnegative().optional(),
  staff_count: z.number().int().nonnegative().optional(),
  notes: z.string().max(2000).optional().nullable(),
  issues_identified: z.string().max(2000).optional().nullable(),
})
export type CompleteDrillInput = z.infer<typeof CompleteDrillSchema>

// -- Muster points ----------------------------------------------------------

export const MusterPointSchema = z.object({
  name: z.string().min(1).max(200),
  location_description: z.string().max(1000).optional().nullable(),
  capacity: z.number().int().positive().optional().nullable(),
  floorplan_url: z.string().url().optional().nullable().or(z.literal('')),
  evacuation_procedure: z.string().max(5000).optional().nullable(),
  is_primary: z.boolean().default(false),
  is_active: z.boolean().default(true),
})
export type MusterPointInput = z.infer<typeof MusterPointSchema>

export const UpdateMusterPointSchema = MusterPointSchema.partial().extend({
  id: z.string().uuid(),
})
export type UpdateMusterPointInput = z.infer<typeof UpdateMusterPointSchema>

// -- Emergency contacts -----------------------------------------------------

export const EmergencyContactSchema = z.object({
  contact_type: z.enum([
    'police',
    'fire',
    'ems',
    'poison_control',
    'hospital',
    'cps',
    'licensing',
    'facility_maintenance',
    'other',
  ]),
  name: z.string().min(1).max(200),
  role: z.string().max(200).optional().nullable(),
  phone: z.string().min(1).max(40),
  phone_alt: z.string().max(40).optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().max(500).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  sort_order: z.number().int().nonnegative().default(0),
  is_active: z.boolean().default(true),
})
export type EmergencyContactInput = z.infer<typeof EmergencyContactSchema>

export const UpdateEmergencyContactSchema = EmergencyContactSchema.partial().extend({
  id: z.string().uuid(),
})
export type UpdateEmergencyContactInput = z.infer<typeof UpdateEmergencyContactSchema>
