// @anchor: cca.food-program.manage-menus
'use server'

import {
  CreateMealMenuSchema,
  UpdateMealMenuSchema,
  type CreateMealMenuInput,
  type UpdateMealMenuInput,
} from '@/lib/schemas/food-program'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type ManageMenuState = {
  ok: boolean
  error?: string
  id?: string
  warnings?: string[]
}

/** Validate USDA meal pattern requirements based on meal type */
function validateUSDAPattern(
  mealType: string,
  components: { grains: boolean; meat_alt: boolean; vegetable: boolean; fruit: boolean; milk: boolean }
): string[] {
  const warnings: string[] = []

  // CACFP meal pattern requirements differ by meal type
  if (mealType === 'breakfast') {
    if (!components.grains) warnings.push('Breakfast requires a grains component')
    if (!components.milk) warnings.push('Breakfast requires a milk component')
    if (!components.fruit && !components.vegetable) warnings.push('Breakfast requires a fruit or vegetable')
  } else if (mealType === 'lunch' || mealType === 'supper') {
    if (!components.grains) warnings.push(`${mealType} requires a grains component`)
    if (!components.meat_alt) warnings.push(`${mealType} requires a meat/meat alternate`)
    if (!components.vegetable) warnings.push(`${mealType} requires a vegetable`)
    if (!components.fruit) warnings.push(`${mealType} requires a fruit`)
    if (!components.milk) warnings.push(`${mealType} requires a milk component`)
  } else if (mealType === 'am_snack' || mealType === 'pm_snack') {
    // Snacks require at least 2 of the 5 food components
    const count = [components.grains, components.meat_alt, components.vegetable, components.fruit, components.milk].filter(Boolean).length
    if (count < 2) warnings.push('Snacks require at least 2 different food components')
  }

  return warnings
}

export async function createMealMenu(input: CreateMealMenuInput): Promise<ManageMenuState> {
  await assertRole('admin')

  const parsed = CreateMealMenuSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // USDA validation
  const warnings = validateUSDAPattern(data.meal_type, data.food_components)
  const meetsCACFPPattern = warnings.length === 0

  const { data: menu, error } = await supabase
    .from('meal_menus')
    .insert({
      tenant_id: tenantId,
      classroom_id: data.classroom_id ?? null,
      date: data.date,
      meal_type: data.meal_type,
      items: data.items,
      food_components: data.food_components,
      meets_cacfp_pattern: meetsCACFPPattern,
      created_by: actorId,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (error || !menu) {
    return { ok: false, error: error?.message ?? 'Failed to create menu' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'food_program.menu.created',
    entity_type: 'meal_menu',
    entity_id: menu.id,
    after_data: data,
  })

  return { ok: true, id: menu.id, warnings: warnings.length > 0 ? warnings : undefined }
}

export async function updateMealMenu(input: UpdateMealMenuInput): Promise<ManageMenuState> {
  await assertRole('admin')

  const parsed = UpdateMealMenuSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  const { id, ...updateFields } = data

  // Re-validate USDA if components changed
  let warnings: string[] = []
  if (updateFields.food_components && updateFields.meal_type) {
    warnings = validateUSDAPattern(updateFields.meal_type, updateFields.food_components)
    ;(updateFields as Record<string, unknown>).meets_cacfp_pattern = warnings.length === 0
  }

  const { error } = await supabase
    .from('meal_menus')
    .update(updateFields)
    .eq('id', id)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'food_program.menu.updated',
    entity_type: 'meal_menu',
    entity_id: id,
    after_data: data,
  })

  return { ok: true, id, warnings: warnings.length > 0 ? warnings : undefined }
}
