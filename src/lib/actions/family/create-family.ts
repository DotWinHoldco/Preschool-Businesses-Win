'use server'

// @anchor: cca.family.create-action
// Server action: create a family and optionally link initial members.
// Validates with Zod, inserts into Supabase, writes audit log.

import { CreateFamilySchema, type CreateFamilyInput } from '@/lib/schemas/family'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type CreateFamilyResult = {
  ok: boolean
  familyId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createFamily(input: CreateFamilyInput): Promise<CreateFamilyResult> {
  await assertRole('admin')

  // 1. Validate
  const parsed = CreateFamilySchema.safeParse(input)
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

  // 2. Insert family
  const { data: family, error } = await supabase
    .from('families')
    .insert({
      tenant_id: tenantId,
      family_name: data.family_name,
      mailing_address_line1: data.mailing_address_line1 || null,
      mailing_address_line2: data.mailing_address_line2 || null,
      mailing_city: data.mailing_city || null,
      mailing_state: data.mailing_state || null,
      mailing_zip: data.mailing_zip || null,
      billing_email: data.billing_email || null,
      billing_phone: data.billing_phone || null,
      notes_internal: data.notes_internal || null,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id')
    .single()

  if (error || !family) {
    return { ok: false, error: error?.message || 'Failed to create family' }
  }

  // 3. Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'family',
    entity_id: family.id,
    after_data: data as unknown as Record<string, unknown>,
  })

  return { ok: true, familyId: family.id }
}
