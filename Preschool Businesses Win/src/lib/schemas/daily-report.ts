// @anchor: cca.daily-report.schema
// Zod schemas for daily report entries.
// Matches daily_reports and daily_report_entries tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Entry type enum
// ---------------------------------------------------------------------------

export const dailyReportEntryTypeEnum = z.enum([
  'meal',
  'nap',
  'diaper',
  'activity',
  'mood',
  'milestone',
  'note',
  'photo',
])

export type DailyReportEntryType = z.infer<typeof dailyReportEntryTypeEnum>

// ---------------------------------------------------------------------------
// Meal data
// ---------------------------------------------------------------------------

export const mealTypeEnum = z.enum(['breakfast', 'lunch', 'snack'])
export const amountEatenEnum = z.enum(['all', 'most', 'some', 'none'])

export const MealDataSchema = z.object({
  meal_type: mealTypeEnum,
  items_offered: z.array(z.string()).default([]),
  amount_eaten: amountEatenEnum,
  notes: z.string().max(2000).optional(),
})

export type MealData = z.infer<typeof MealDataSchema>

// ---------------------------------------------------------------------------
// Nap data
// ---------------------------------------------------------------------------

export const napQualityEnum = z.enum(['restful', 'restless', 'refused'])

export const NapDataSchema = z.object({
  started_at: z.string().min(1, 'Start time is required'),
  ended_at: z.string().min(1, 'End time is required'),
  quality: napQualityEnum,
})

export type NapData = z.infer<typeof NapDataSchema>

// ---------------------------------------------------------------------------
// Diaper data
// ---------------------------------------------------------------------------

export const diaperTypeEnum = z.enum(['wet', 'dry', 'bm'])

export const DiaperDataSchema = z.object({
  type: diaperTypeEnum,
  notes: z.string().max(500).optional(),
})

export type DiaperData = z.infer<typeof DiaperDataSchema>

// ---------------------------------------------------------------------------
// Activity data
// ---------------------------------------------------------------------------

export const engagementLevelEnum = z.enum(['high', 'medium', 'low'])

export const ActivityDataSchema = z.object({
  activity_name: z.string().min(1, 'Activity name is required').max(200),
  description: z.string().max(2000).optional(),
  engagement_level: engagementLevelEnum,
  photo_paths: z.array(z.string()).default([]),
})

export type ActivityData = z.infer<typeof ActivityDataSchema>

// ---------------------------------------------------------------------------
// Mood data
// ---------------------------------------------------------------------------

export const moodEnum = z.enum(['happy', 'calm', 'fussy', 'upset', 'tired'])

export const MoodDataSchema = z.object({
  overall: moodEnum,
  notes: z.string().max(1000).optional(),
})

export type MoodData = z.infer<typeof MoodDataSchema>

// ---------------------------------------------------------------------------
// Milestone data
// ---------------------------------------------------------------------------

export const MilestoneDataSchema = z.object({
  category: z.string().min(1).max(200),
  milestone: z.string().min(1).max(500),
  notes: z.string().max(2000).optional(),
  evidence_path: z.string().optional(),
})

export type MilestoneData = z.infer<typeof MilestoneDataSchema>

// ---------------------------------------------------------------------------
// Note data
// ---------------------------------------------------------------------------

export const noteVisibilityEnum = z.enum(['parent', 'staff_only'])

export const NoteDataSchema = z.object({
  text: z.string().min(1, 'Note text is required').max(5000),
  visibility: noteVisibilityEnum.default('parent'),
})

export type NoteData = z.infer<typeof NoteDataSchema>

// ---------------------------------------------------------------------------
// Photo data
// ---------------------------------------------------------------------------

export const PhotoDataSchema = z.object({
  path: z.string().min(1, 'Photo path is required'),
  caption: z.string().max(500).optional(),
  visibility: noteVisibilityEnum.default('parent'),
})

export type PhotoData = z.infer<typeof PhotoDataSchema>

// ---------------------------------------------------------------------------
// Create entry (discriminated by entry_type)
// ---------------------------------------------------------------------------

export const CreateDailyReportEntrySchema = z.object({
  report_id: z.string().uuid('Invalid report ID'),
  student_id: z.string().uuid('Invalid student ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
  entry_type: dailyReportEntryTypeEnum,
  timestamp: z.string().optional(),
  data: z.record(z.string(), z.unknown()),
})

export type CreateDailyReportEntryInput = z.infer<typeof CreateDailyReportEntrySchema>

// ---------------------------------------------------------------------------
// Publish report
// ---------------------------------------------------------------------------

export const PublishReportSchema = z.object({
  report_id: z.string().uuid('Invalid report ID'),
  student_id: z.string().uuid('Invalid student ID'),
})

export type PublishReportInput = z.infer<typeof PublishReportSchema>

// ---------------------------------------------------------------------------
// Report status enum
// ---------------------------------------------------------------------------

export const reportStatusEnum = z.enum(['draft', 'published'])

export type ReportStatus = z.infer<typeof reportStatusEnum>
