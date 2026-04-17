'use server'

// @anchor: cca.appointments.availability.actions

import {
  StaffAvailabilitySchema,
  StaffAvailabilityOverrideSchema,
  type StaffAvailabilityInput,
  type StaffAvailabilityOverrideInput,
} from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

type ActionResult = { ok: boolean; id?: string; error?: string }

export async function setStaffAvailability(
  inputs: StaffAvailabilityInput[],
): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  if (inputs.length === 0) return { ok: true }

  const parsed: StaffAvailabilityInput[] = []
  for (const i of inputs) {
    const r = StaffAvailabilitySchema.safeParse(i)
    if (!r.success) return { ok: false, error: r.error.issues[0]?.message ?? 'Validation failed' }
    parsed.push(r.data)
  }

  const userId = parsed[0].user_id

  // Replace this user's availability atomically — delete then insert
  const { error: delError } = await supabase
    .from('staff_availability')
    .delete()
    .eq('tenant_id', tenantId)
    .eq('user_id', userId)

  if (delError) return { ok: false, error: delError.message }

  const rows = parsed.map((p) => ({
    tenant_id: tenantId,
    user_id: p.user_id,
    day_of_week: p.day_of_week,
    start_time: p.start_time,
    end_time: p.end_time,
    appointment_type_id: p.appointment_type_id ?? null,
    effective_from: p.effective_from ?? new Date().toISOString().slice(0, 10),
    effective_to: p.effective_to ?? null,
  }))

  const { error } = await supabase.from('staff_availability').insert(rows)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff_availability.set',
    entityType: 'staff_availability',
    entityId: userId,
    after: { count: rows.length },
  })

  return { ok: true }
}

export async function addAvailabilityOverride(
  input: StaffAvailabilityOverrideInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = StaffAvailabilityOverrideSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('staff_availability_overrides')
    .insert({
      tenant_id: tenantId,
      user_id: parsed.data.user_id,
      date: parsed.data.date,
      is_available: parsed.data.is_available,
      start_time: parsed.data.start_time ?? null,
      end_time: parsed.data.end_time ?? null,
      reason: parsed.data.reason ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff_availability.override.add',
    entityType: 'staff_availability_override',
    entityId: data.id as string,
    after: parsed.data,
  })

  return { ok: true, id: data.id as string }
}

export async function removeAvailabilityOverride(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('staff_availability_overrides')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff_availability.override.remove',
    entityType: 'staff_availability_override',
    entityId: id,
  })

  return { ok: true }
}
