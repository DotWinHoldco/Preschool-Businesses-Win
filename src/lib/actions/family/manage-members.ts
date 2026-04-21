'use server'

// @anchor: cca.family.member-actions
// Server actions: add and remove family members.
// Validates with Zod, writes audit log.

import {
  CreateFamilyMemberSchema,
  UpdateFamilyMemberSchema,
  RemoveFamilyMemberSchema,
  type CreateFamilyMemberInput,
  type UpdateFamilyMemberInput,
} from '@/lib/schemas/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type MemberResult = {
  ok: boolean
  memberId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

// ---------------------------------------------------------------------------
// Add family member
// ---------------------------------------------------------------------------

export async function addFamilyMember(input: CreateFamilyMemberInput): Promise<MemberResult> {
  await assertRole('admin')

  const parsed = CreateFamilyMemberSchema.safeParse(input)
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

  const { data: member, error } = await supabase
    .from('family_members')
    .insert({
      tenant_id: tenantId,
      family_id: data.family_id,
      user_id: data.user_id || null,
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email || null,
      phone: data.phone || null,
      relationship_type: data.relationship_type,
      relationship_label: data.relationship_label || null,
      is_primary_contact: data.is_primary_contact,
      is_billing_responsible: data.is_billing_responsible,
      can_pickup_default: data.can_pickup_default,
      lives_in_household: data.lives_in_household,
      custody_notes: data.custody_notes || null,
    })
    .select('id')
    .single()

  if (error || !member) {
    return { ok: false, error: error?.message || 'Failed to add family member' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'family_member',
    entity_id: member.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  return { ok: true, memberId: member.id }
}

// ---------------------------------------------------------------------------
// Update family member
// ---------------------------------------------------------------------------

export async function updateFamilyMember(input: UpdateFamilyMemberInput): Promise<MemberResult> {
  await assertRole('admin')

  const parsed = UpdateFamilyMemberSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const { id, family_id, ...updates } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', id)
    .eq('family_id', family_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Family member not found' }
  }

  const { error } = await supabase
    .from('family_members')
    .update(updates)
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'family_member',
    entity_id: id,
    before_data: before as unknown as Record<string, unknown>,
    after_data: updates as unknown as Record<string, unknown>,
  })

  return { ok: true, memberId: id }
}

// ---------------------------------------------------------------------------
// Remove family member
// ---------------------------------------------------------------------------

export async function removeFamilyMember(
  input: { id: string; family_id: string },
): Promise<MemberResult> {
  await assertRole('admin')

  const parsed = RemoveFamilyMemberSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('family_members')
    .select('*')
    .eq('id', input.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Family member not found' }
  }

  const { error } = await supabase
    .from('family_members')
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
    entity_type: 'family_member',
    entity_id: input.id,
    before_data: before as unknown as Record<string, unknown>,
  })

  return { ok: true }
}
