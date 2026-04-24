// @anchor: cca.family.extras
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import { saveTenantSettings } from '@/lib/actions/settings/tenant-settings'
import {
  AddFamilyDocumentSchema,
  DeleteFamilyDocumentSchema,
  SaveFamilyBillingPreferencesSchema,
  VerifyPickupSchema,
  type AddFamilyDocumentInput,
  type DeleteFamilyDocumentInput,
  type SaveFamilyBillingPreferencesInput,
  type VerifyPickupInput,
} from '@/lib/schemas/family'

export type FamilyExtrasState = {
  ok: boolean
  error?: string
  id?: string
}

// ---------------------------------------------------------------------------
// Family documents
// ---------------------------------------------------------------------------

export async function addFamilyDocument(input: AddFamilyDocumentInput): Promise<FamilyExtrasState> {
  await assertRole('admin')

  const parsed = AddFamilyDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row, error } = await supabase
    .from('family_documents')
    .insert({
      tenant_id: tenantId,
      family_id: data.family_id,
      document_type: data.document_type,
      file_path: data.file_path,
      file_name: data.file_name ?? null,
      expiry_date: data.expiry_date || null,
      notes: data.notes ?? null,
      uploaded_by: actorId,
    })
    .select('id')
    .single()

  if (error || !row) {
    return { ok: false, error: error?.message ?? 'Failed to add document' }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'family_document.added',
    entityType: 'family_document',
    entityId: row.id,
    after: { ...data },
  })

  revalidatePath(`/portal/admin/families/${data.family_id}`)
  return { ok: true, id: row.id }
}

export async function deleteFamilyDocument(
  input: DeleteFamilyDocumentInput,
): Promise<FamilyExtrasState> {
  await assertRole('admin')

  const parsed = DeleteFamilyDocumentSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('family_documents')
    .select('*')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Document not found' }
  }

  const { error } = await supabase
    .from('family_documents')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'family_document.deleted',
    entityType: 'family_document',
    entityId: parsed.data.id,
    before: before as Record<string, unknown>,
  })

  if (before.family_id) {
    revalidatePath(`/portal/admin/families/${before.family_id}`)
  }
  return { ok: true, id: parsed.data.id }
}

// ---------------------------------------------------------------------------
// Billing preferences — stored under tenant_settings `family.<id>.billing.*`
// ---------------------------------------------------------------------------

export async function saveFamilyBillingPreferences(
  input: SaveFamilyBillingPreferencesInput,
): Promise<FamilyExtrasState> {
  await assertRole('admin')

  const parsed = SaveFamilyBillingPreferencesSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const { family_id, autopay, channel, frequency } = parsed.data

  const prefix = `family.${family_id}.billing`
  const result = await saveTenantSettings(
    prefix,
    { autopay, channel, frequency },
    {
      pagePath: `/portal/admin/families/${family_id}`,
      auditAction: 'family.billing_prefs.updated',
    },
  )

  if (!result.ok) {
    return { ok: false, error: result.error ?? 'Failed to save billing preferences' }
  }

  return { ok: true, id: family_id }
}

// ---------------------------------------------------------------------------
// Authorized pickup verification
// ---------------------------------------------------------------------------

export async function verifyPickupPhoto(input: VerifyPickupInput): Promise<FamilyExtrasState> {
  await assertRole('admin')

  const parsed = VerifyPickupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('authorized_pickups')
    .select('*')
    .eq('id', parsed.data.pickup_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Pickup not found' }
  }

  const { error } = await supabase
    .from('authorized_pickups')
    .update({ photo_verified: true })
    .eq('id', parsed.data.pickup_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'authorized_pickup.photo_verified',
    entityType: 'authorized_pickup',
    entityId: parsed.data.pickup_id,
    before: before as Record<string, unknown>,
    after: { photo_verified: true },
  })

  if (before.family_id) {
    revalidatePath(`/portal/admin/families/${before.family_id}`)
  }
  return { ok: true, id: parsed.data.pickup_id }
}

export async function verifyPickupId(input: VerifyPickupInput): Promise<FamilyExtrasState> {
  await assertRole('admin')

  const parsed = VerifyPickupSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('authorized_pickups')
    .select('*')
    .eq('id', parsed.data.pickup_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Pickup not found' }
  }

  const { error } = await supabase
    .from('authorized_pickups')
    .update({ government_id_verified_at: new Date().toISOString() })
    .eq('id', parsed.data.pickup_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'authorized_pickup.id_verified',
    entityType: 'authorized_pickup',
    entityId: parsed.data.pickup_id,
    before: before as Record<string, unknown>,
    after: { government_id_verified_at: new Date().toISOString() },
  })

  if (before.family_id) {
    revalidatePath(`/portal/admin/families/${before.family_id}`)
  }
  return { ok: true, id: parsed.data.pickup_id }
}
