// @anchor: cca.food-program.save-meal-menus
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
  FoodComponentsSchema,
  mealTypeEnum,
  type FoodComponents,
  type MealType,
} from '@/lib/schemas/food-program'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type SaveMealMenusState = {
  ok: boolean
  error?: string
  count?: number
  warnings?: string[]
}

const MenuRowSchema = z.object({
  classroom_id: z.string().uuid().optional().nullable(),
  date: z.string().min(1, 'Date is required'),
  meal_type: mealTypeEnum,
  items: z.array(z.string().min(1)).default([]),
  food_components: FoodComponentsSchema.optional().default({
    grains: false,
    meat_alt: false,
    vegetable: false,
    fruit: false,
    milk: false,
  }),
  notes: z.string().max(2000).optional().nullable(),
})

const SaveMealMenusSchema = z.object({
  menus: z.array(MenuRowSchema),
})

export type SaveMealMenusInput = z.infer<typeof SaveMealMenusSchema>

/** Validate USDA meal pattern requirements (5 components: grain, meat/alt, veg, fruit, milk) */
function validateUSDAPattern(mealType: MealType, components: FoodComponents): boolean {
  if (mealType === 'breakfast') {
    return (
      !!components.grains && !!components.milk && (!!components.fruit || !!components.vegetable)
    )
  }
  if (mealType === 'lunch' || mealType === 'supper') {
    return (
      !!components.grains &&
      !!components.meat_alt &&
      !!components.vegetable &&
      !!components.fruit &&
      !!components.milk
    )
  }
  // Snacks need at least 2 components
  const count = [
    components.grains,
    components.meat_alt,
    components.vegetable,
    components.fruit,
    components.milk,
  ].filter(Boolean).length
  return count >= 2
}

/**
 * Upsert a batch of meal menus by (tenant_id, date, meal_type, classroom_id).
 * Replaces client-only menu plans with persistent rows.
 */
export async function saveMealMenus(input: SaveMealMenusInput): Promise<SaveMealMenusState> {
  await assertRole('admin')

  const parsed = SaveMealMenusSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const warnings: string[] = []
  let saved = 0

  // Upsert each menu row individually (composite match on date + meal_type + classroom_id)
  for (const menu of parsed.data.menus) {
    // Normalize components to the 5-key shape
    const components: FoodComponents = {
      grains: !!menu.food_components.grains,
      meat_alt: !!menu.food_components.meat_alt,
      vegetable: !!menu.food_components.vegetable,
      fruit: !!menu.food_components.fruit,
      milk: !!menu.food_components.milk,
    }

    const meetsCACFP = validateUSDAPattern(menu.meal_type, components)
    if (!meetsCACFP) {
      warnings.push(`${menu.date} ${menu.meal_type}: does not meet CACFP pattern`)
    }

    // Look for existing row
    let query = supabase
      .from('meal_menus')
      .select('id')
      .eq('tenant_id', tenantId)
      .eq('date', menu.date)
      .eq('meal_type', menu.meal_type)

    if (menu.classroom_id) {
      query = query.eq('classroom_id', menu.classroom_id)
    } else {
      query = query.is('classroom_id', null)
    }

    const { data: existing } = await query.maybeSingle()

    if (existing?.id) {
      // Update
      const { error } = await supabase
        .from('meal_menus')
        .update({
          items: menu.items,
          food_components: components,
          meets_cacfp_pattern: meetsCACFP,
          notes: menu.notes ?? null,
        })
        .eq('id', existing.id)
        .eq('tenant_id', tenantId)

      if (error) {
        return { ok: false, error: error.message }
      }
    } else {
      // Insert
      const { error } = await supabase.from('meal_menus').insert({
        tenant_id: tenantId,
        classroom_id: menu.classroom_id ?? null,
        date: menu.date,
        meal_type: menu.meal_type,
        items: menu.items,
        food_components: components,
        meets_cacfp_pattern: meetsCACFP,
        created_by: actorId,
        notes: menu.notes ?? null,
      })

      if (error) {
        return { ok: false, error: error.message }
      }
    }

    saved += 1
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'food_program.menus.saved',
    entity_type: 'meal_menu',
    after_data: { count: saved, warning_count: warnings.length },
  })

  revalidatePath('/portal/admin/food-program/menus')

  return {
    ok: true,
    count: saved,
    warnings: warnings.length > 0 ? warnings : undefined,
  }
}
