// @anchor: cca.curriculum.plan-days.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { UpsertLessonPlanDaySchema, type UpsertLessonPlanDayInput } from '@/lib/schemas/curriculum'

export type ActionState = { ok: boolean; error?: string; id?: string }

export async function upsertLessonPlanDay(input: UpsertLessonPlanDayInput): Promise<ActionState> {
  await assertRole('lead_teacher')
  const parsed = UpsertLessonPlanDaySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const data = parsed.data

  const { data: row, error } = await supabase
    .from('lesson_plan_days')
    .upsert(
      {
        tenant_id: tenantId,
        lesson_plan_id: data.lesson_plan_id,
        day_of_week: data.day_of_week,
        title: data.title ?? null,
        body: data.body ?? null,
        reflection: data.reflection ?? null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_plan_id,day_of_week' },
    )
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to save day' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lesson_plan_day.saved',
    entity_type: 'lesson_plan_day',
    entity_id: row.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/curriculum/${data.lesson_plan_id}`)
  return { ok: true, id: row.id }
}
