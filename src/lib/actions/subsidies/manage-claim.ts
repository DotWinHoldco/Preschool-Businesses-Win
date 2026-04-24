// @anchor: cca.subsidy.manage-claim
'use server'

import { revalidatePath } from 'next/cache'
import {
  MarkSubsidyClaimSubmittedSchema,
  MarkSubsidyClaimPaidSchema,
  CancelSubsidyClaimSchema,
  type MarkSubsidyClaimSubmittedInput,
  type MarkSubsidyClaimPaidInput,
  type CancelSubsidyClaimInput,
} from '@/lib/schemas/subsidy'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type ManageSubsidyClaimState = {
  ok: boolean
  error?: string
  id?: string
}

export async function markSubsidyClaimSubmitted(
  input: MarkSubsidyClaimSubmittedInput,
): Promise<ManageSubsidyClaimState> {
  await assertRole('admin')

  const parsed = MarkSubsidyClaimSubmittedSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('subsidy_claims')
    .update({ status: 'submitted', submitted_at: new Date().toISOString() })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.claim.submitted',
    entity_type: 'subsidy_claim',
    entity_id: parsed.data.id,
  })

  revalidatePath('/portal/admin/subsidies/claims')
  return { ok: true, id: parsed.data.id }
}

export async function markSubsidyClaimPaid(
  input: MarkSubsidyClaimPaidInput,
): Promise<ManageSubsidyClaimState> {
  await assertRole('admin')

  const parsed = MarkSubsidyClaimPaidSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('subsidy_claims')
    .select('total_claimed_cents')
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)
    .single()

  const totalClaimed = (before?.total_claimed_cents as number) ?? 0
  const paid = parsed.data.total_paid_cents
  const newStatus = paid >= totalClaimed ? 'paid' : 'partially_paid'

  const { error } = await supabase
    .from('subsidy_claims')
    .update({
      status: newStatus,
      total_paid_cents: paid,
      paid_at: new Date().toISOString(),
    })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.claim.paid',
    entity_type: 'subsidy_claim',
    entity_id: parsed.data.id,
    after_data: { total_paid_cents: paid, status: newStatus },
  })

  revalidatePath('/portal/admin/subsidies/claims')
  return { ok: true, id: parsed.data.id }
}

export async function cancelSubsidyClaim(
  input: CancelSubsidyClaimInput,
): Promise<ManageSubsidyClaimState> {
  await assertRole('admin')

  const parsed = CancelSubsidyClaimSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('subsidy_claims')
    .update({
      status: 'denied',
      denial_reason: parsed.data.reason ?? 'Cancelled by admin',
    })
    .eq('id', parsed.data.id)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.claim.cancelled',
    entity_type: 'subsidy_claim',
    entity_id: parsed.data.id,
    after_data: { reason: parsed.data.reason ?? null },
  })

  revalidatePath('/portal/admin/subsidies/claims')
  return { ok: true, id: parsed.data.id }
}
