'use server'

// @anchor: cca.crm.audiences
// Server actions for audiences (saved segments). Static lists are
// hand-managed; dynamic audiences materialize from a JSON filter tree.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { resolveFilterContacts, type FilterTree } from '@/lib/crm/audience-filter'

interface Result {
  ok: boolean
  error?: string
  id?: string
  count?: number
}

const FilterTreeSchema: z.ZodType<FilterTree> = z.object({
  match: z.enum(['all', 'any']),
  conditions: z.array(
    z.object({
      field: z.string(),
      operator: z.string(),
      value: z.unknown().optional().nullable(),
    }),
  ),
}) as unknown as z.ZodType<FilterTree>

const AudienceCreateSchema = z.object({
  name: z.string().trim().min(1).max(80),
  description: z.string().trim().max(400).optional().nullable(),
  type: z.enum(['static', 'dynamic']),
  filter_json: FilterTreeSchema.optional(),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .default('#3b70b0'),
  kanban_enabled: z.boolean().default(false),
  kanban_columns: z.array(z.string().min(1).max(40)).max(12).default([]),
})

const AudienceUpdateSchema = AudienceCreateSchema.partial().extend({
  id: z.string().uuid(),
})

const ContactsSchema = z.object({
  audience_id: z.string().uuid(),
  contact_ids: z.array(z.string().uuid()).min(1).max(5000),
  kanban_column: z.string().optional().nullable(),
})

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

export async function createAudience(input: unknown): Promise<Result> {
  const parsed = AudienceCreateSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  if (data.kanban_enabled && data.kanban_columns.length === 0) {
    return { ok: false, error: 'Kanban audiences need at least one column.' }
  }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const slug = slugify(data.name)
  if (!slug) return { ok: false, error: 'Name must contain letters or numbers.' }

  const { data: inserted, error } = await supabase
    .from('audiences')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      slug,
      description: data.description ?? null,
      type: data.type,
      filter_json: data.filter_json ?? { match: 'all', conditions: [] },
      color: data.color,
      kanban_enabled: data.kanban_enabled,
      kanban_columns: data.kanban_columns,
      created_by: session.user.id,
    })
    .select('id')
    .single()

  if (error) {
    if ((error as { code?: string }).code === '23505') {
      return { ok: false, error: 'An audience with that name already exists.' }
    }
    return { ok: false, error: error.message }
  }

  // For dynamic, materialize on create.
  if (data.type === 'dynamic') {
    await refreshDynamicAudienceInternal(supabase, tenantId, inserted!.id as string)
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.audience.created',
    entityType: 'audience',
    entityId: inserted!.id as string,
    after: { name: data.name, type: data.type, kanban_enabled: data.kanban_enabled },
  })

  revalidatePath('/portal/admin/crm/audiences')
  return { ok: true, id: inserted!.id as string }
}

export async function updateAudience(input: unknown): Promise<Result> {
  const parsed = AudienceUpdateSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: existing } = await supabase
    .from('audiences')
    .select('id, tenant_id, type')
    .eq('id', data.id)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (data.name !== undefined) {
    patch.name = data.name
    patch.slug = slugify(data.name)
  }
  if (data.description !== undefined) patch.description = data.description
  if (data.color !== undefined) patch.color = data.color
  if (data.kanban_enabled !== undefined) patch.kanban_enabled = data.kanban_enabled
  if (data.kanban_columns !== undefined) patch.kanban_columns = data.kanban_columns
  if (data.filter_json !== undefined) patch.filter_json = data.filter_json

  const { error } = await supabase.from('audiences').update(patch).eq('id', data.id)
  if (error) return { ok: false, error: error.message }

  if (existing.type === 'dynamic' && data.filter_json) {
    await refreshDynamicAudienceInternal(supabase, tenantId, data.id)
  }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.audience.updated',
    entityType: 'audience',
    entityId: data.id,
    after: patch,
  })

  revalidatePath('/portal/admin/crm/audiences')
  revalidatePath(`/portal/admin/crm/audiences/${data.id}`)
  return { ok: true, id: data.id }
}

export async function deleteAudience(audienceId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: existing } = await supabase
    .from('audiences')
    .select('id, tenant_id, name')
    .eq('id', audienceId)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }

  const { error } = await supabase.from('audiences').delete().eq('id', audienceId)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.audience.deleted',
    entityType: 'audience',
    entityId: audienceId,
    after: { name: existing.name },
  })

  revalidatePath('/portal/admin/crm/audiences')
  return { ok: true }
}

export async function addContactsToAudience(input: unknown): Promise<Result> {
  const parsed = ContactsSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: aud } = await supabase
    .from('audiences')
    .select('id, tenant_id, type, kanban_enabled, kanban_columns')
    .eq('id', parsed.data.audience_id)
    .maybeSingle()
  if (!aud || aud.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (aud.type === 'dynamic')
    return { ok: false, error: 'Dynamic audiences are rule-driven; edit the filter instead.' }

  const defaultCol =
    aud.kanban_enabled && (aud.kanban_columns as string[]).length > 0
      ? (parsed.data.kanban_column ?? (aud.kanban_columns as string[])[0])
      : null

  const rows = parsed.data.contact_ids.map((cid) => ({
    audience_id: parsed.data.audience_id,
    contact_id: cid,
    tenant_id: tenantId,
    source: 'manual' as const,
    kanban_column: defaultCol,
    added_by: session.user.id,
  }))

  const { error } = await supabase
    .from('audience_members')
    .upsert(rows, { onConflict: 'audience_id,contact_id' })
  if (error) return { ok: false, error: error.message }

  // Activity entries
  await supabase.from('contact_activities').insert(
    parsed.data.contact_ids.map((cid) => ({
      tenant_id: tenantId,
      contact_id: cid,
      activity_type: 'audience_added',
      title: 'Added to audience',
      actor_user_id: session.user.id,
      related_entity_type: 'audience',
      related_entity_id: parsed.data.audience_id,
    })),
  )

  await supabase.rpc('refresh_audience_count', { p_audience_id: parsed.data.audience_id })

  revalidatePath(`/portal/admin/crm/audiences/${parsed.data.audience_id}`)
  return { ok: true, count: rows.length }
}

export async function removeContactFromAudience(
  audienceId: string,
  contactId: string,
): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: aud } = await supabase
    .from('audiences')
    .select('id, tenant_id, type')
    .eq('id', audienceId)
    .maybeSingle()
  if (!aud || aud.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (aud.type === 'dynamic')
    return { ok: false, error: 'Dynamic audience members are rule-driven.' }

  const { error } = await supabase
    .from('audience_members')
    .delete()
    .eq('audience_id', audienceId)
    .eq('contact_id', contactId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('contact_activities').insert({
    tenant_id: tenantId,
    contact_id: contactId,
    activity_type: 'audience_removed',
    title: 'Removed from audience',
    actor_user_id: session.user.id,
    related_entity_type: 'audience',
    related_entity_id: audienceId,
  })

  await supabase.rpc('refresh_audience_count', { p_audience_id: audienceId })

  revalidatePath(`/portal/admin/crm/audiences/${audienceId}`)
  return { ok: true }
}

export async function moveKanbanCard(
  audienceId: string,
  contactId: string,
  toColumn: string,
): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: aud } = await supabase
    .from('audiences')
    .select('id, tenant_id, kanban_enabled, kanban_columns')
    .eq('id', audienceId)
    .maybeSingle()
  if (!aud || aud.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (!aud.kanban_enabled) return { ok: false, error: 'Audience is not configured as a kanban.' }
  if (!(aud.kanban_columns as string[]).includes(toColumn)) {
    return { ok: false, error: 'Unknown kanban column.' }
  }

  const { error } = await supabase
    .from('audience_members')
    .update({ kanban_column: toColumn })
    .eq('audience_id', audienceId)
    .eq('contact_id', contactId)
  if (error) return { ok: false, error: error.message }

  await supabase.from('contact_activities').insert({
    tenant_id: tenantId,
    contact_id: contactId,
    activity_type: 'custom',
    title: `Moved to ${toColumn} on kanban`,
    actor_user_id: session.user.id,
    related_entity_type: 'audience',
    related_entity_id: audienceId,
  })

  revalidatePath(`/portal/admin/crm/pipelines/${audienceId}`)
  return { ok: true }
}

export async function refreshDynamicAudience(audienceId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: aud } = await supabase
    .from('audiences')
    .select('id, tenant_id, type, filter_json')
    .eq('id', audienceId)
    .maybeSingle()
  if (!aud || aud.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (aud.type !== 'dynamic')
    return { ok: false, error: 'Only dynamic audiences can be refreshed.' }

  const count = await refreshDynamicAudienceInternal(supabase, tenantId, audienceId)

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.audience.refreshed',
    entityType: 'audience',
    entityId: audienceId,
    after: { count },
  })

  revalidatePath(`/portal/admin/crm/audiences/${audienceId}`)
  return { ok: true, count }
}

async function refreshDynamicAudienceInternal(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  audienceId: string,
): Promise<number> {
  const { data: aud } = await supabase
    .from('audiences')
    .select('filter_json')
    .eq('id', audienceId)
    .maybeSingle()
  const filter = (aud?.filter_json as FilterTree) ?? { match: 'all', conditions: [] }
  const ids = await resolveFilterContacts(supabase, tenantId, filter)

  // Replace memberships idempotently. Delete-then-upsert avoids stale rows.
  await supabase
    .from('audience_members')
    .delete()
    .eq('audience_id', audienceId)
    .eq('source', 'rule')

  if (ids.length > 0) {
    const rows = ids.map((cid) => ({
      audience_id: audienceId,
      contact_id: cid,
      tenant_id: tenantId,
      source: 'rule' as const,
    }))
    // Chunk to avoid statement size limits.
    const CHUNK = 1000
    for (let i = 0; i < rows.length; i += CHUNK) {
      await supabase.from('audience_members').upsert(rows.slice(i, i + CHUNK), {
        onConflict: 'audience_id,contact_id',
      })
    }
  }

  await supabase.rpc('refresh_audience_count', { p_audience_id: audienceId })
  return ids.length
}
