'use server'

// @anchor: cca.crm.contacts
// Server actions for the unified contact entity. All mutations are
// admin/director-gated, tenant-scoped, audit-logged, and produce a
// contact_activities timeline entry where applicable.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import {
  ContactCreateSchema,
  ContactUpdateSchema,
  NoteSchema,
  TagAssignSchema,
  TagCreateSchema,
} from '@/lib/schemas/crm'
import { emitEvent } from '@/lib/crm/events'

interface Result {
  ok: boolean
  error?: string
  id?: string
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

async function authedAdmin() {
  const { session } = await assertRole('admin')
  const tenantId = await getTenantId()
  return { session, tenantId, supabase: createAdminClient() }
}

// ---------------------------------------------------------------------------
// CONTACTS
// ---------------------------------------------------------------------------

export async function createContact(input: unknown): Promise<Result> {
  const parsed = ContactCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  // Either email or phone path. ensure_contact_for_email handles email; for
  // phone-only, we use ensure_contact_for_phone.
  let contactId: string
  try {
    if (data.email) {
      const { data: rpcRes, error } = await supabase.rpc('ensure_contact_for_email', {
        p_tenant_id: tenantId,
        p_email: data.email,
        p_first_name: data.first_name ?? null,
        p_last_name: data.last_name ?? null,
        p_phone: data.phone ?? null,
        p_source: data.source,
        p_source_detail: data.source_detail ?? null,
      })
      if (error) return { ok: false, error: error.message }
      contactId = rpcRes as string
    } else if (data.phone) {
      const { data: rpcRes, error } = await supabase.rpc('ensure_contact_for_phone', {
        p_tenant_id: tenantId,
        p_phone: data.phone,
        p_first_name: data.first_name ?? null,
        p_last_name: data.last_name ?? null,
        p_source: data.source,
      })
      if (error) return { ok: false, error: error.message }
      contactId = rpcRes as string
    } else {
      return { ok: false, error: 'Email or phone required' }
    }

    // Apply lifecycle + ownership + notes that ensure_* doesn't set.
    const patch: Record<string, unknown> = {}
    if (data.notes) patch.notes = data.notes
    if (data.owner_user_id) patch.owner_user_id = data.owner_user_id
    if (data.lifecycle_stage) {
      // Use advance helper so we don't downgrade.
      await supabase.rpc('advance_contact_lifecycle', {
        p_contact_id: contactId,
        p_target: data.lifecycle_stage,
      })
    }
    if (Object.keys(patch).length > 0) {
      await supabase.from('contacts').update(patch).eq('id', contactId)
    }

    if (data.tag_ids && data.tag_ids.length > 0) {
      await supabase.from('contact_tag_assignments').upsert(
        data.tag_ids.map((tagId) => ({
          contact_id: contactId,
          tag_id: tagId,
          tenant_id: tenantId,
          added_by: session.user.id,
        })),
        { onConflict: 'contact_id,tag_id' },
      )
    }

    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'crm.contact.created',
      entityType: 'contact',
      entityId: contactId,
      after: {
        email: data.email,
        phone: data.phone,
        lifecycle_stage: data.lifecycle_stage,
        source: data.source,
      },
    })

    await emitEvent({
      tenantId,
      contactId,
      kind: 'contact.created',
      payload: {
        source: data.source,
        lifecycle_stage: data.lifecycle_stage,
        email: data.email,
      },
      source: 'admin_console',
    })
    if (data.lifecycle_stage === 'lead') {
      await emitEvent({
        tenantId,
        contactId,
        kind: 'lead.created',
        payload: { source: data.source },
        source: 'admin_console',
      })
    }

    revalidatePath('/portal/admin/crm/contacts')
    revalidatePath(`/portal/admin/crm/contacts/${contactId}`)
    return { ok: true, id: contactId }
  } catch (e) {
    console.error('[crm/createContact]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

export async function updateContact(input: unknown): Promise<Result> {
  const parsed = ContactUpdateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  // Verify tenant ownership before update.
  const { data: existing, error: loadErr } = await supabase
    .from('contacts')
    .select('id, tenant_id, lifecycle_stage')
    .eq('id', data.id)
    .maybeSingle()
  if (loadErr || !existing) return { ok: false, error: 'Contact not found' }
  if (existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.email !== undefined) patch.email = data.email
  if (data.phone !== undefined) patch.phone = data.phone
  if (data.first_name !== undefined) patch.first_name = data.first_name
  if (data.last_name !== undefined) patch.last_name = data.last_name
  if (data.source !== undefined) patch.source = data.source
  if (data.source_detail !== undefined) patch.source_detail = data.source_detail
  if (data.notes !== undefined) patch.notes = data.notes
  if (data.owner_user_id !== undefined) patch.owner_user_id = data.owner_user_id
  if (data.email_subscribed !== undefined) {
    patch.email_subscribed = data.email_subscribed
    if (!data.email_subscribed) {
      patch.email_unsubscribed_at = new Date().toISOString()
      patch.email_unsubscribe_reason = 'admin_action'
    } else {
      patch.email_unsubscribed_at = null
      patch.email_unsubscribe_reason = null
    }
  }

  const { error: updErr } = await supabase.from('contacts').update(patch).eq('id', data.id)
  if (updErr) return { ok: false, error: updErr.message }

  // Lifecycle goes through the helper so we never downgrade silently.
  if (data.lifecycle_stage && data.lifecycle_stage !== existing.lifecycle_stage) {
    await supabase.rpc('advance_contact_lifecycle', {
      p_contact_id: data.id,
      p_target: data.lifecycle_stage,
    })
    await emitEvent({
      tenantId,
      contactId: data.id,
      kind: 'contact.lifecycle_changed',
      payload: { from: existing.lifecycle_stage, to: data.lifecycle_stage },
      source: 'admin_console',
    })
  }
  await emitEvent({
    tenantId,
    contactId: data.id,
    kind: 'contact.updated',
    payload: { fields: Object.keys(patch) },
    source: 'admin_console',
  })

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.contact.updated',
    entityType: 'contact',
    entityId: data.id,
    after: patch,
  })

  revalidatePath('/portal/admin/crm/contacts')
  revalidatePath(`/portal/admin/crm/contacts/${data.id}`)
  return { ok: true, id: data.id }
}

export async function softDeleteContact(contactId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: existing } = await supabase
    .from('contacts')
    .select('id, tenant_id')
    .eq('id', contactId)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) {
    return { ok: false, error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('contacts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', contactId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.contact.deleted',
    entityType: 'contact',
    entityId: contactId,
  })

  revalidatePath('/portal/admin/crm/contacts')
  return { ok: true, id: contactId }
}

export async function assignContactOwner(
  contactId: string,
  ownerUserId: string | null,
): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: existing } = await supabase
    .from('contacts')
    .select('id, tenant_id, owner_user_id')
    .eq('id', contactId)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) {
    return { ok: false, error: 'Not authorized' }
  }

  const { error } = await supabase
    .from('contacts')
    .update({ owner_user_id: ownerUserId })
    .eq('id', contactId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('contact_activities').insert({
    tenant_id: tenantId,
    contact_id: contactId,
    activity_type: 'owner_assigned',
    title: ownerUserId ? 'Owner reassigned' : 'Owner cleared',
    actor_user_id: session.user.id,
    payload: { from: existing.owner_user_id, to: ownerUserId },
  })

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.contact.owner_assigned',
    entityType: 'contact',
    entityId: contactId,
    after: { owner_user_id: ownerUserId },
  })

  revalidatePath('/portal/admin/crm/contacts')
  revalidatePath(`/portal/admin/crm/contacts/${contactId}`)
  return { ok: true, id: contactId }
}

// ---------------------------------------------------------------------------
// NOTES (creates a note_added activity)
// ---------------------------------------------------------------------------

export async function addContactNote(input: unknown): Promise<Result> {
  const parsed = NoteSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const { contact_id, body } = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: existing } = await supabase
    .from('contacts')
    .select('id, tenant_id')
    .eq('id', contact_id)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: inserted, error } = await supabase
    .from('contact_activities')
    .insert({
      tenant_id: tenantId,
      contact_id,
      activity_type: 'note_added',
      title: 'Note added',
      body,
      actor_user_id: session.user.id,
    })
    .select('id')
    .single()

  if (error || !inserted) return { ok: false, error: error?.message ?? 'failed' }

  await supabase
    .from('contacts')
    .update({ last_activity_at: new Date().toISOString() })
    .eq('id', contact_id)

  await emitEvent({
    tenantId,
    contactId: contact_id,
    kind: 'note.added',
    payload: { note_id: inserted.id as string, preview: body.slice(0, 240) },
    source: 'admin_console',
  })

  revalidatePath(`/portal/admin/crm/contacts/${contact_id}`)
  return { ok: true, id: inserted.id as string }
}

// ---------------------------------------------------------------------------
// TAGS
// ---------------------------------------------------------------------------

export async function createTag(input: unknown): Promise<Result> {
  const parsed = TagCreateSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const slug = slugify(parsed.data.label)
  if (!slug) return { ok: false, error: 'Tag must contain letters or numbers.' }

  const { data: inserted, error } = await supabase
    .from('contact_tags')
    .insert({
      tenant_id: tenantId,
      slug,
      label: parsed.data.label,
      color: parsed.data.color,
      description: parsed.data.description ?? null,
      created_by: session.user.id,
    })
    .select('id')
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { ok: false, error: 'A tag with that name already exists.' }
    }
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.tag.created',
    entityType: 'contact_tag',
    entityId: inserted!.id as string,
    after: parsed.data,
  })

  revalidatePath('/portal/admin/crm/contacts')
  return { ok: true, id: inserted!.id as string }
}

export async function deleteTag(tagId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: tag } = await supabase
    .from('contact_tags')
    .select('id, tenant_id, is_system, label')
    .eq('id', tagId)
    .maybeSingle()
  if (!tag || tag.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (tag.is_system) return { ok: false, error: 'System tags cannot be deleted.' }

  const { error } = await supabase.from('contact_tags').delete().eq('id', tagId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.tag.deleted',
    entityType: 'contact_tag',
    entityId: tagId,
    after: { label: tag.label },
  })

  revalidatePath('/portal/admin/crm/contacts')
  return { ok: true }
}

export async function addTagToContact(input: unknown): Promise<Result> {
  const parsed = TagAssignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  // Verify both rows belong to tenant.
  const [{ data: c }, { data: t }] = await Promise.all([
    supabase
      .from('contacts')
      .select('id, tenant_id')
      .eq('id', parsed.data.contact_id)
      .maybeSingle(),
    supabase
      .from('contact_tags')
      .select('id, tenant_id, label')
      .eq('id', parsed.data.tag_id)
      .maybeSingle(),
  ])
  if (!c || c.tenant_id !== tenantId) return { ok: false, error: 'Contact not authorized' }
  if (!t || t.tenant_id !== tenantId) return { ok: false, error: 'Tag not authorized' }

  const { error } = await supabase.from('contact_tag_assignments').upsert(
    {
      contact_id: parsed.data.contact_id,
      tag_id: parsed.data.tag_id,
      tenant_id: tenantId,
      added_by: session.user.id,
    },
    { onConflict: 'contact_id,tag_id' },
  )
  if (error) return { ok: false, error: error.message }

  await supabase.from('contact_activities').insert({
    tenant_id: tenantId,
    contact_id: parsed.data.contact_id,
    activity_type: 'tag_added',
    title: `Tagged: ${t.label}`,
    actor_user_id: session.user.id,
    related_entity_type: 'contact_tag',
    related_entity_id: parsed.data.tag_id,
  })

  await emitEvent({
    tenantId,
    contactId: parsed.data.contact_id,
    kind: 'contact.tag_added',
    payload: { tag_id: parsed.data.tag_id, tag_label: t.label },
    source: 'admin_console',
  })

  revalidatePath(`/portal/admin/crm/contacts/${parsed.data.contact_id}`)
  return { ok: true }
}

export async function removeTagFromContact(input: unknown): Promise<Result> {
  const parsed = TagAssignSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: c } = await supabase
    .from('contacts')
    .select('id, tenant_id')
    .eq('id', parsed.data.contact_id)
    .maybeSingle()
  if (!c || c.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }

  const { data: t } = await supabase
    .from('contact_tags')
    .select('label')
    .eq('id', parsed.data.tag_id)
    .maybeSingle()

  const { error } = await supabase
    .from('contact_tag_assignments')
    .delete()
    .eq('contact_id', parsed.data.contact_id)
    .eq('tag_id', parsed.data.tag_id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('contact_activities').insert({
    tenant_id: tenantId,
    contact_id: parsed.data.contact_id,
    activity_type: 'tag_removed',
    title: `Removed tag: ${t?.label ?? 'tag'}`,
    actor_user_id: session.user.id,
    related_entity_type: 'contact_tag',
    related_entity_id: parsed.data.tag_id,
  })

  await emitEvent({
    tenantId,
    contactId: parsed.data.contact_id,
    kind: 'contact.tag_removed',
    payload: { tag_id: parsed.data.tag_id, tag_label: t?.label ?? null },
    source: 'admin_console',
  })

  revalidatePath(`/portal/admin/crm/contacts/${parsed.data.contact_id}`)
  return { ok: true }
}
