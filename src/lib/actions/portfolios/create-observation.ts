// @anchor: cca.portfolio.create-observation
'use server'

import { assertRole } from '@/lib/auth/session'
import { CreateObservationSchema, type CreateObservationInput } from '@/lib/schemas/portfolio'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type CreateObservationState = {
  ok: boolean
  error?: string
  id?: string
}

export async function createObservation(
  input: CreateObservationInput
): Promise<CreateObservationState> {
  await assertRole('aide')
  // Validate with Zod
  const parsed = CreateObservationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Build narrative for learning stories (combine fields) or use plain narrative
  const narrative = data.narrative

  // Insert portfolio entry
  const { data: entry, error: entryError } = await supabase
    .from('portfolio_entries')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      entry_type: data.entry_type,
      title: data.title,
      narrative,
      learning_domains: data.learning_domain_ids,
      visibility: data.visibility,
      linked_daily_report_entry_id: data.linked_daily_report_entry_id ?? null,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (entryError || !entry) {
    return { ok: false, error: entryError?.message ?? 'Failed to create observation' }
  }

  // Insert media attachments
  if (data.media.length > 0) {
    const mediaRows = data.media.map((m) => ({
      tenant_id: tenantId,
      entry_id: entry.id,
      file_path: m.file_path,
      media_type: m.media_type,
      caption: m.caption ?? null,
    }))

    const { error: mediaError } = await supabase
      .from('portfolio_media')
      .insert(mediaRows)

    if (mediaError) {
      return { ok: false, error: mediaError.message }
    }
  }

  // Write audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.observation.created',
    entity_type: 'portfolio_entry',
    entity_id: entry.id,
    after_data: data,
  })

  return { ok: true, id: entry.id }
}
