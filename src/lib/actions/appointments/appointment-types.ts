'use server'

// @anchor: cca.appointments.types.actions

import {
  CreateAppointmentTypeSchema,
  UpdateAppointmentTypeSchema,
  type CreateAppointmentTypeInput,
  type UpdateAppointmentTypeInput,
} from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

type ActionResult = { ok: boolean; id?: string; slug?: string; error?: string }

export async function createAppointmentType(
  input: CreateAppointmentTypeInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateAppointmentTypeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const d = parsed.data

  const { data, error } = await supabase
    .from('appointment_types')
    .insert({
      tenant_id: tenantId,
      name: d.name,
      slug: d.slug,
      description: d.description ?? null,
      duration_minutes: d.duration_minutes,
      buffer_before_minutes: d.buffer_before_minutes,
      buffer_after_minutes: d.buffer_after_minutes,
      color: d.color ?? null,
      location: d.location ?? null,
      location_type: d.location_type,
      virtual_meeting_url: d.virtual_meeting_url || null,
      booking_window_days: d.booking_window_days,
      min_notice_hours: d.min_notice_hours,
      max_per_day: d.max_per_day ?? null,
      max_per_slot: d.max_per_slot,
      assigned_staff: d.assigned_staff,
      round_robin: d.round_robin,
      require_confirmation: d.require_confirmation,
      auto_confirm: d.auto_confirm,
      confirmation_message: d.confirmation_message ?? null,
      reminder_hours: d.reminder_hours,
      linked_pipeline_stage: d.linked_pipeline_stage ?? null,
      price_cents: d.price_cents ?? null,
      is_active: d.is_active,
      created_by: actorId,
    })
    .select('id, slug')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment_type.create',
    entityType: 'appointment_type',
    entityId: data.id as string,
    after: { name: d.name, slug: d.slug },
  })

  return { ok: true, id: data.id as string, slug: data.slug as string }
}

export async function updateAppointmentType(
  input: UpdateAppointmentTypeInput,
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateAppointmentTypeSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const { id, ...rest } = parsed.data

  const update: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(rest)) {
    if (value !== undefined) update[key] = value
  }
  update.updated_at = new Date().toISOString()

  const { error } = await supabase
    .from('appointment_types')
    .update(update)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment_type.update',
    entityType: 'appointment_type',
    entityId: id,
    after: update,
  })

  return { ok: true, id }
}

export async function deleteAppointmentType(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase
    .from('appointment_types')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'appointment_type.deactivate',
    entityType: 'appointment_type',
    entityId: id,
  })

  return { ok: true, id }
}
