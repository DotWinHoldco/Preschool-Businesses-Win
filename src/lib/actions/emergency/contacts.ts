// @anchor: cca.emergency.contacts.actions
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  EmergencyContactSchema,
  UpdateEmergencyContactSchema,
  type EmergencyContactInput,
  type UpdateEmergencyContactInput,
} from '@/lib/schemas/emergency'

export type ActionResult = { ok: boolean; error?: string; id?: string }

function normalize(data: Partial<EmergencyContactInput>): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data }
  if ((data.email ?? '') === '') out.email = null
  return out
}

export async function createEmergencyContact(input: EmergencyContactInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = EmergencyContactSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('emergency_contacts')
    .insert({ tenant_id: tenantId, ...normalize(parsed.data) })
    .select('id')
    .single()

  if (error || !row) return { ok: false, error: error?.message ?? 'Failed to add contact' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.contact_created',
    entityType: 'emergency_contact',
    entityId: row.id,
    after: parsed.data as unknown as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: row.id }
}

export async function updateEmergencyContact(
  input: UpdateEmergencyContactInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateEmergencyContactSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)
  const { id, ...rest } = parsed.data

  const { error } = await supabase
    .from('emergency_contacts')
    .update(normalize(rest))
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.contact_updated',
    entityType: 'emergency_contact',
    entityId: id,
    after: rest as Record<string, unknown>,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id }
}

const DeleteSchema = z.object({ id: z.string().uuid() })

export async function deleteEmergencyContact(input: { id: string }): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = DeleteSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('emergency_contacts')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'emergency.contact_deleted',
    entityType: 'emergency_contact',
    entityId: parsed.data.id,
  })
  revalidatePath('/portal/admin/emergency')
  return { ok: true, id: parsed.data.id }
}
