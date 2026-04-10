// @anchor: cca.food-program.schema
// Zod schemas for CACFP food program — meal menus, meal service records, and claims.
// Matches meal_menus, meal_service_records, cacfp_claims, cacfp_claim_lines tables.

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Meal type enum
// ---------------------------------------------------------------------------

export const mealTypeEnum = z.enum([
  'breakfast',
  'am_snack',
  'lunch',
  'pm_snack',
  'supper',
])

export type MealType = z.infer<typeof mealTypeEnum>

// ---------------------------------------------------------------------------
// Amount eaten enum
// ---------------------------------------------------------------------------

export const amountEatenEnum = z.enum(['all', 'most', 'some', 'none'])

export type AmountEaten = z.infer<typeof amountEatenEnum>

// ---------------------------------------------------------------------------
// Claim status enum
// ---------------------------------------------------------------------------

export const claimStatusEnum = z.enum([
  'draft',
  'submitted',
  'paid',
  'rejected',
])

export type ClaimStatus = z.infer<typeof claimStatusEnum>

// ---------------------------------------------------------------------------
// Food components (USDA meal pattern requirements)
// ---------------------------------------------------------------------------

export const FoodComponentsSchema = z.object({
  grains: z.boolean().default(false),
  meat_alt: z.boolean().default(false),
  vegetable: z.boolean().default(false),
  fruit: z.boolean().default(false),
  milk: z.boolean().default(false),
})

export type FoodComponents = z.infer<typeof FoodComponentsSchema>

// ---------------------------------------------------------------------------
// Create / Update Meal Menu
// ---------------------------------------------------------------------------

export const CreateMealMenuSchema = z.object({
  classroom_id: z.string().uuid().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  meal_type: mealTypeEnum,
  items: z.array(z.string().min(1)).min(1, 'At least one item is required'),
  food_components: FoodComponentsSchema,
  notes: z.string().max(2000).optional(),
})

export type CreateMealMenuInput = z.infer<typeof CreateMealMenuSchema>

export const UpdateMealMenuSchema = z.object({
  id: z.string().uuid('Invalid menu ID'),
  classroom_id: z.string().uuid().optional().nullable(),
  date: z.string().optional(),
  meal_type: mealTypeEnum.optional(),
  items: z.array(z.string().min(1)).optional(),
  food_components: FoodComponentsSchema.optional(),
  notes: z.string().max(2000).optional().nullable(),
})

export type UpdateMealMenuInput = z.infer<typeof UpdateMealMenuSchema>

// ---------------------------------------------------------------------------
// Record Meal Service (individual)
// ---------------------------------------------------------------------------

export const RecordMealServiceSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  meal_menu_id: z.string().uuid('Invalid menu ID'),
  date: z.string().min(1, 'Date is required'),
  meal_type: mealTypeEnum,
  served: z.boolean().default(true),
  amount_eaten: amountEatenEnum.optional(),
  substitution_reason: z.string().max(500).optional(),
  allergy_substitution: z.boolean().default(false),
  notes: z.string().max(1000).optional(),
})

export type RecordMealServiceInput = z.infer<typeof RecordMealServiceSchema>

// ---------------------------------------------------------------------------
// Bulk Record Meal Service (whole classroom)
// ---------------------------------------------------------------------------

export const BulkRecordMealServiceSchema = z.object({
  meal_menu_id: z.string().uuid('Invalid menu ID'),
  classroom_id: z.string().uuid('Invalid classroom ID'),
  date: z.string().min(1, 'Date is required'),
  meal_type: mealTypeEnum,
  student_records: z.array(
    z.object({
      student_id: z.string().uuid(),
      served: z.boolean().default(true),
      amount_eaten: amountEatenEnum.optional(),
      substitution_reason: z.string().max(500).optional(),
      allergy_substitution: z.boolean().default(false),
      notes: z.string().max(1000).optional(),
    })
  ),
})

export type BulkRecordMealServiceInput = z.infer<typeof BulkRecordMealServiceSchema>

// ---------------------------------------------------------------------------
// Generate CACFP Claim
// ---------------------------------------------------------------------------

export const GenerateCACFPClaimSchema = z.object({
  claim_month: z.number().int().min(1).max(12),
  claim_year: z.number().int().min(2020).max(2100),
  notes: z.string().max(5000).optional(),
})

export type GenerateCACFPClaimInput = z.infer<typeof GenerateCACFPClaimSchema>
