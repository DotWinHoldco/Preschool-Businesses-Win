// @anchor: cca.portfolio.create-learning-story
'use server'

import { assertRole } from '@/lib/auth/session'
import { CreateLearningStorySchema, type CreateLearningStoryInput } from '@/lib/schemas/portfolio'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type CreateLearningStoryState = {
  ok: boolean
  error?: string
  id?: string
}

export async function createLearningStory(
  input: CreateLearningStoryInput
): Promise<CreateLearningStoryState> {
  await assertRole('lead_teacher')
  const parsed = CreateLearningStorySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Compose narrative from the three-part learning story format
  const narrative = [
    `## What Happened\n${data.what_happened}`,
    `## What Learning Occurred\n${data.what_learning_occurred}`,
    data.what_next ? `## What's Next\n${data.what_next}` : '',
  ]
    .filter(Boolean)
    .join('\n\n')

  const { data: entry, error: entryError } = await supabase
    .from('portfolio_entries')
    .insert({
      tenant_id: tenantId,
      student_id: data.student_id,
      entry_type: 'learning_story',
      title: data.title,
      narrative,
      learning_domains: data.learning_domain_ids,
      visibility: data.visibility,
      created_by: actorId,
    })
    .select('id')
    .single()

  if (entryError || !entry) {
    return { ok: false, error: entryError?.message ?? 'Failed to create learning story' }
  }

  // Insert media
  if (data.media.length > 0) {
    const mediaRows = data.media.map((m) => ({
      tenant_id: tenantId,
      entry_id: entry.id,
      file_path: m.file_path,
      media_type: m.media_type,
      caption: m.caption ?? null,
    }))

    await supabase.from('portfolio_media').insert(mediaRows)
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.learning_story.created',
    entity_type: 'portfolio_entry',
    entity_id: entry.id,
    after_data: data,
  })

  return { ok: true, id: entry.id }
}
