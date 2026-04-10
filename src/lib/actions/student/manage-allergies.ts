'use server'

// @anchor: cca.medical.allergy-actions
// Server actions: add, update, and remove student allergies.
// Every allergy change is audited — allergy info is child-safety-critical.

import {
  CreateAllergySchema,
  UpdateAllergySchema,
  RemoveAllergySchema,
  type CreateAllergyInput,
  type UpdateAllergyInput,
} from '@/lib/schemas/student'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type AllergyResult = {
  ok: boolean
  allergyId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Add allergy
// ---------------------------------------------------------------------------

export async function addAllergy(input: CreateAllergyInput): Promise<AllergyResult> {
  await assertRole('admin')

  const parsed = CreateAllergySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: allergy, error } = await supabase
    .from('student_allergies')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      allergen: data.allergen,
      severity: data.severity,
      reaction_description: data.reaction_description || null,
      treatment_protocol: data.treatment_protocol || null,
      medication_name: data.medication_name || null,
      medication_location: data.medication_location || null,
      epipen_on_site: data.epipen_on_site,
      notes: data.notes || null,
      verified_by: actorId,
      verified_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (error || !allergy) {
    return { ok: false, error: error?.message || 'Failed to add allergy' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'student_allergy',
    entity_id: allergy.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, allergyId: allergy.id }
}

// ---------------------------------------------------------------------------
// Update allergy
// ---------------------------------------------------------------------------

export async function updateAllergy(input: UpdateAllergyInput): Promise<AllergyResult> {
  await assertRole('admin')

  const parsed = UpdateAllergySchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('student_allergies')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Allergy record not found' }
  }

  const { id: _id, ...updateData } = data
  const { error } = await supabase
    .from('student_allergies')
    .update(updateData)
    .eq('id', data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'student_allergy',
    entity_id: data.id,
    before: before as unknown as Record<string, unknown>,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, allergyId: data.id }
}

// ---------------------------------------------------------------------------
// Remove allergy (soft delete via audit — keeps the record for safety)
// ---------------------------------------------------------------------------

export async function removeAllergy(
  input: { id: string; student_id: string },
): Promise<AllergyResult> {
  await assertRole('admin')

  const parsed = RemoveAllergySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('student_allergies')
    .select('*')
    .eq('id', input.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Allergy record not found' }
  }

  const { error } = await supabase
    .from('student_allergies')
    .delete()
    .eq('id', input.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'delete',
    entity_type: 'student_allergy',
    entity_id: input.id,
    before: before as unknown as Record<string, unknown>,
  })

  return { ok: true }
}
