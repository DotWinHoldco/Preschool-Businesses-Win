// @anchor: cca.emergency.initiate-v2
// A simpler initiate/resolve pair that works against the incidents/emergency
// page. The original initiate-emergency.ts has side-effects we preserve.
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  InitiateEmergencySchema,
  ResolveEmergencySchema,
  type InitiateEmergencyInput,
  type ResolveEmergencyInput,
} from '@/lib/schemas/emergency'

export type ActionResult = { ok: boolean; error?: string; id?: string }

export async function initiateEmergencyEvent(input: InitiateEmergencyInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = InitiateEmergencySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const { data: row, error } = await supabase
    .from('emergency_events')
    .insert({
      tenant_id: tenantId,
      event_type: parsed.data.event_type,
      severity: parsed.data.severity,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      initiated_by: actorId,
      initiated_at: now,
      status: 'active',
    })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to initiate emergency' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.initiated',
    entityType: 'emergency_event',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: row.id }
}

export async function resolveEmergencyEvent(input: ResolveEmergencyInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = ResolveEmergencySchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const now = new Date().toISOString()

  const { error } = await supabase
    .from('emergency_events')
    .update({
      status: 'all_clear',
      resolved_at: now,
      resolved_by: actorId,
      all_clear_message: parsed.data.all_clear_message,
      notes: parsed.data.notes ?? null,
    })
    .eq('id', parsed.data.event_id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.all_clear',
    entityType: 'emergency_event',
    entityId: parsed.data.event_id,
    after: { all_clear_message: parsed.data.all_clear_message },
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: parsed.data.event_id }
}
