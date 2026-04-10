// @anchor: cca.calendar.schemas
// Zod schemas for calendar events, RSVPs, sign-ups
// See CCA_BUILD_BRIEF.md §36

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Event types
// ---------------------------------------------------------------------------

export const CalendarEventTypeSchema = z.enum([
  'closure',
  'holiday',
  'field_trip',
  'special_event',
  'parent_night',
  'chapel',
  'staff_meeting',
  'other',
])
export type CalendarEventType = z.infer<typeof CalendarEventTypeSchema>

// ---------------------------------------------------------------------------
// Event scope
// ---------------------------------------------------------------------------

export const EventScopeSchema = z.enum([
  'school_wide',
  'classroom',
  'staff_only',
])
export type EventScope = z.infer<typeof EventScopeSchema>

// ---------------------------------------------------------------------------
// RSVP response
// ---------------------------------------------------------------------------

export const RSVPResponseSchema = z.enum(['yes', 'no', 'maybe'])
export type RSVPResponse = z.infer<typeof RSVPResponseSchema>

// ---------------------------------------------------------------------------
// Create calendar event
// ---------------------------------------------------------------------------

export const CreateCalendarEventSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(2000).optional(),
  event_type: CalendarEventTypeSchema,
  start_at: z.string().datetime(),
  end_at: z.string().datetime(),
  all_day: z.boolean().default(false),
  recurrence_rule: z
    .object({
      frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
      interval: z.number().int().min(1).max(52).default(1),
      until: z.string().datetime().optional(),
      count: z.number().int().min(1).max(365).optional(),
      days_of_week: z.array(z.number().int().min(0).max(6)).optional(),
    })
    .optional(),
  location: z.string().max(300).optional(),
  scope: EventScopeSchema,
  classroom_id: z.string().uuid().optional(),
  requires_rsvp: z.boolean().default(false),
  requires_permission_slip: z.boolean().default(false),
  max_participants: z.number().int().min(1).optional(),
  cost_per_child_cents: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
})
export type CreateCalendarEventInput = z.infer<typeof CreateCalendarEventSchema>

// ---------------------------------------------------------------------------
// Update calendar event
// ---------------------------------------------------------------------------

export const UpdateCalendarEventSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(2000).optional(),
  event_type: CalendarEventTypeSchema.optional(),
  start_at: z.string().datetime().optional(),
  end_at: z.string().datetime().optional(),
  all_day: z.boolean().optional(),
  location: z.string().max(300).optional(),
  scope: EventScopeSchema.optional(),
  classroom_id: z.string().uuid().optional(),
  requires_rsvp: z.boolean().optional(),
  max_participants: z.number().int().min(1).optional(),
  cost_per_child_cents: z.number().int().min(0).optional(),
  notes: z.string().max(2000).optional(),
})
export type UpdateCalendarEventInput = z.infer<typeof UpdateCalendarEventSchema>

// ---------------------------------------------------------------------------
// RSVP
// ---------------------------------------------------------------------------

export const ProcessRSVPSchema = z.object({
  event_id: z.string().uuid(),
  family_id: z.string().uuid(),
  student_id: z.string().uuid().optional(),
  response: RSVPResponseSchema,
  notes: z.string().max(500).optional(),
})
export type ProcessRSVPInput = z.infer<typeof ProcessRSVPSchema>

// ---------------------------------------------------------------------------
// Sign-up
// ---------------------------------------------------------------------------

export const CreateEventSignUpSchema = z.object({
  event_id: z.string().uuid(),
  title: z.string().min(1).max(300),
  description: z.string().max(1000).optional(),
  slots_total: z.number().int().min(1).max(500),
})
export type CreateEventSignUpInput = z.infer<typeof CreateEventSignUpSchema>

export const JoinEventSignUpSchema = z.object({
  sign_up_id: z.string().uuid(),
  family_id: z.string().uuid(),
  notes: z.string().max(500).optional(),
})
export type JoinEventSignUpInput = z.infer<typeof JoinEventSignUpSchema>
