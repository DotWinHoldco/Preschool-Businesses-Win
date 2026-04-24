// @anchor: cca.emergency.drills.actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  ScheduleDrillSchema,
  CompleteDrillSchema,
  type ScheduleDrillInput,
  type CompleteDrillInput,
} from '@/lib/schemas/emergency'

export type ActionResult = { ok: boolean; error?: string; id?: string }

export async function scheduleDrill(input: ScheduleDrillInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = ScheduleDrillSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('emergency_drills')
    .insert({
      tenant_id: tenantId,
      drill_type: parsed.data.drill_type,
      scheduled_at: parsed.data.scheduled_at,
      notes: parsed.data.notes ?? null,
      muster_point_id: parsed.data.muster_point_id ?? null,
      led_by: actorId,
      status: 'scheduled',
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to schedule drill' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.drill_scheduled',
    entityType: 'emergency_drill',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: row.id }
}

export async function completeDrill(input: CompleteDrillInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CompleteDrillSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const { id, ...rest } = parsed.data
  const { error } = await supabase
    .from('emergency_drills')
    .update({ ...rest, status: 'completed', completed_at: now })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.drill_completed',
    entityType: 'emergency_drill',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id }
}
