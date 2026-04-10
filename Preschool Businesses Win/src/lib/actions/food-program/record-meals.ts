// @anchor: cca.food-program.record-meals
'use server'

import {
  RecordMealServiceSchema,
  BulkRecordMealServiceSchema,
  type RecordMealServiceInput,
  type BulkRecordMealServiceInput,
} from '@/lib/schemas/food-program'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type RecordMealsState = {
  ok: boolean
  error?: string
  count?: number
}

export async function recordMealService(input: RecordMealServiceInput): Promise<RecordMealsState> {
  const parsed = RecordMealServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { error } = await supabase.from('meal_service_records').insert({
    tenant_id: tenantId,
    student_id: data.student_id,
    meal_menu_id: data.meal_menu_id,
    date: data.date,
    meal_type: data.meal_type,
    served: data.served,
    amount_eaten: data.amount_eaten ?? null,
    substitution_reason: data.substitution_reason ?? null,
    allergy_substitution: data.allergy_substitution,
    notes: data.notes ?? null,
    recorded_by: actorId,
  })

  if (error) {
    return { ok: false, error: error.message }
  }

  return { ok: true, count: 1 }
}

export async function bulkRecordMealService(input: BulkRecordMealServiceInput): Promise<RecordMealsState> {
  const parsed = BulkRecordMealServiceSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const rows = data.student_records.map((sr) => ({
    tenant_id: tenantId,
    student_id: sr.student_id,
    meal_menu_id: data.meal_menu_id,
    date: data.date,
    meal_type: data.meal_type,
    served: sr.served,
    amount_eaten: sr.amount_eaten ?? null,
    substitution_reason: sr.substitution_reason ?? null,
    allergy_substitution: sr.allergy_substitution,
    notes: sr.notes ?? null,
    recorded_by: actorId,
  }))

  const { error } = await supabase.from('meal_service_records').insert(rows)

  if (error) {
    return { ok: false, error: error.message }
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'food_program.meals.bulk_recorded',
    entity_type: 'meal_service_record',
    entity_id: data.classroom_id,
    after: { date: data.date, meal_type: data.meal_type, count: rows.length },
  })

  return { ok: true, count: rows.length }
}
