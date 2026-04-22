// @anchor: cca.portfolio.delete-entry
'use server'

import { assertRole } from '@/lib/auth/session'
import { DeletePortfolioEntrySchema, type DeletePortfolioEntryInput } from '@/lib/schemas/portfolio'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type DeletePortfolioEntryState = {
  ok: boolean
  error?: string
}

export async function deletePortfolioEntry(
  input: DeletePortfolioEntryInput
): Promise<DeletePortfolioEntryState> {
  await assertRole('lead_teacher')
  const parsed = DeletePortfolioEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: existing, error: fetchError } = await supabase
    .from('portfolio_entries')
    .select('id, student_id, entry_type, title, narrative, visibility, learning_domains')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !existing) {
    return { ok: false, error: 'Entry not found' }
  }

  await supabase
    .from('portfolio_media')
    .delete()
    .eq('entry_id', parsed.data.id)
    .eq('tenant_id', tenantId)

  const { error: deleteError } = await supabase
    .from('portfolio_entries')
    .delete()
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (deleteError) {
    return { ok: false, error: deleteError.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.entry.deleted',
    entity_type: 'portfolio_entry',
    entity_id: parsed.data.id,
    before_data: {
      student_id: existing.student_id,
      entry_type: existing.entry_type,
      title: existing.title,
      narrative: existing.narrative,
      visibility: existing.visibility,
      learning_domains: existing.learning_domains,
    },
  })

  return { ok: true }
}
