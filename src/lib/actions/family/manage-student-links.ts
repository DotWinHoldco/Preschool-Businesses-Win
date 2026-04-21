'use server'

import {
  LinkStudentFamilySchema,
  UpdateStudentFamilyLinkSchema,
  UnlinkStudentFamilySchema,
  type LinkStudentFamilyInput,
  type UpdateStudentFamilyLinkInput,
} from '@/lib/schemas/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type LinkResult = {
  ok: boolean
  linkId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function linkStudentToFamily(input: LinkStudentFamilyInput): Promise<LinkResult> {
  await assertRole('admin')

  const parsed = LinkStudentFamilySchema.safeParse(input)
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

  const { data: existing } = await supabase
    .from('student_family_links')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('student_id', data.student_id)
    .eq('family_id', data.family_id)
    .maybeSingle()

  if (existing) {
    return { ok: false, error: 'This student is already linked to this family' }
  }

  const { data: link, error } = await supabase
    .from('student_family_links')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      family_id: data.family_id,
      billing_split_pct: data.billing_split_pct ?? 100,
      is_primary_family: data.is_primary_family ?? false,
      custody_schedule: data.custody_schedule ?? {},
      notes: data.notes || null,
    })
    .select('id')
    .single()

  if (error || !link) {
    return { ok: false, error: error?.message || 'Failed to create link' }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'student_family_link',
    entity_id: link.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  return { ok: true, linkId: link.id }
}

export async function updateStudentFamilyLink(input: UpdateStudentFamilyLinkInput): Promise<LinkResult> {
  await assertRole('admin')

  const parsed = UpdateStudentFamilyLinkSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const { id, ...updates } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('student_family_links')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Link not found' }
  }

  const { error } = await supabase
    .from('student_family_links')
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
    entity_type: 'student_family_link',
    entity_id: id,
    before_data: before as unknown as Record<string, unknown>,
    after_data: updates as unknown as Record<string, unknown>,
  })

  return { ok: true, linkId: id }
}

export async function unlinkStudentFromFamily(input: { id: string }): Promise<LinkResult> {
  await assertRole('admin')

  const parsed = UnlinkStudentFamilySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: 'Invalid input' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: before } = await supabase
    .from('student_family_links')
    .select('*')
    .eq('id', input.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Link not found' }
  }

  const { error } = await supabase
    .from('student_family_links')
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
    entity_type: 'student_family_link',
    entity_id: input.id,
    before_data: before as unknown as Record<string, unknown>,
  })

  return { ok: true }
}
