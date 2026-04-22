// @anchor: cca.portfolio.update-entry
'use server'

import { assertRole } from '@/lib/auth/session'
import { UpdatePortfolioEntrySchema, type UpdatePortfolioEntryInput } from '@/lib/schemas/portfolio'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type UpdatePortfolioEntryState = {
  ok: boolean
  error?: string
}

export async function updatePortfolioEntry(
  input: UpdatePortfolioEntryInput
): Promise<UpdatePortfolioEntryState> {
  await assertRole('aide')
  const parsed = UpdatePortfolioEntrySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: existing, error: fetchError } = await supabase
    .from('portfolio_entries')
    .select('id, title, narrative, learning_domains, visibility')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (fetchError || !existing) {
    return { ok: false, error: 'Entry not found' }
  }

  const { error: updateError } = await supabase
    .from('portfolio_entries')
    .update({
      title: data.title,
      narrative: data.narrative,
      learning_domains: data.learning_domain_ids,
      visibility: data.visibility,
    })
    .eq('id', data.id)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.entry.updated',
    entity_type: 'portfolio_entry',
    entity_id: data.id,
    before_data: {
      title: existing.title,
      narrative: existing.narrative,
      learning_domains: existing.learning_domains,
      visibility: existing.visibility,
    },
    after_data: {
      title: data.title,
      narrative: data.narrative,
      learning_domains: data.learning_domain_ids,
      visibility: data.visibility,
    },
  })

  return { ok: true }
}
