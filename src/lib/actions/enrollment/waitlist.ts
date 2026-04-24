// @anchor: cca.enrollment.waitlist-actions
'use server'

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'
import {
  SendWaitlistOfferSchema,
  RecordOfferResponseSchema,
  WithdrawOfferSchema,
  ReorderWaitlistSchema,
  type SendWaitlistOfferInput,
  type RecordOfferResponseInput,
  type WithdrawOfferInput,
  type ReorderWaitlistInput,
} from '@/lib/schemas/enrollment'

export type WaitlistActionState = {
  ok: boolean
  error?: string
  id?: string
}

// ---------------------------------------------------------------------------
// Send waitlist offer
// ---------------------------------------------------------------------------

export async function sendWaitlistOffer(
  input: SendWaitlistOfferInput,
): Promise<WaitlistActionState> {
  await assertRole('admin')

  const parsed = SendWaitlistOfferSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: offer, error } = await supabase
    .from('waitlist_offers')
    .insert({
      tenant_id: tenantId,
      application_id: data.application_id,
      classroom_id: data.classroom_id,
      start_date: data.start_date,
      offer_expires_at: data.offer_expires_at,
      notes: data.notes ?? null,
      status: 'sent',
      offered_by: actorId,
    })
    .select('id')
    .single()

  if (error || !offer) {
    return { ok: false, error: error?.message ?? 'Failed to send offer' }
  }

  const { error: updateError } = await supabase
    .from('enrollment_applications')
    .update({ triage_status: 'offered', updated_at: new Date().toISOString() })
    .eq('id', data.application_id)
    .eq('tenant_id', tenantId)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'waitlist_offer.sent',
    entityType: 'waitlist_offer',
    entityId: offer.id,
    after: { ...data },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  revalidatePath(`/portal/admin/enrollment/${data.application_id}`)
  return { ok: true, id: offer.id }
}

// ---------------------------------------------------------------------------
// Record offer response (accept / decline)
// ---------------------------------------------------------------------------

export async function recordOfferResponse(
  input: RecordOfferResponseInput,
): Promise<WaitlistActionState> {
  await assertRole('admin')

  const parsed = RecordOfferResponseSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const data = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('waitlist_offers')
    .select('*')
    .eq('id', data.offer_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Offer not found' }
  }

  const newStatus = data.accepted ? 'accepted' : 'declined'

  const { error } = await supabase
    .from('waitlist_offers')
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
      decline_reason: data.accepted ? null : (data.decline_reason ?? null),
    })
    .eq('id', data.offer_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  if (data.accepted && before.application_id) {
    await supabase
      .from('enrollment_applications')
      .update({
        triage_status: 'enrolled',
        offer_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', before.application_id as string)
      .eq('tenant_id', tenantId)
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: data.accepted ? 'waitlist_offer.accepted' : 'waitlist_offer.declined',
    entityType: 'waitlist_offer',
    entityId: data.offer_id,
    before: before as Record<string, unknown>,
    after: { status: newStatus, decline_reason: data.decline_reason ?? null },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  if (before.application_id) {
    revalidatePath(`/portal/admin/enrollment/${before.application_id}`)
  }
  return { ok: true, id: data.offer_id }
}

// ---------------------------------------------------------------------------
// Withdraw offer
// ---------------------------------------------------------------------------

export async function withdrawOffer(input: WithdrawOfferInput): Promise<WaitlistActionState> {
  await assertRole('admin')

  const parsed = WithdrawOfferSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('waitlist_offers')
    .select('*')
    .eq('id', parsed.data.offer_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Offer not found' }
  }

  const { error } = await supabase
    .from('waitlist_offers')
    .update({ status: 'withdrawn', responded_at: new Date().toISOString() })
    .eq('id', parsed.data.offer_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'waitlist_offer.withdrawn',
    entityType: 'waitlist_offer',
    entityId: parsed.data.offer_id,
    before: before as Record<string, unknown>,
    after: { status: 'withdrawn' },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  return { ok: true, id: parsed.data.offer_id }
}

// ---------------------------------------------------------------------------
// Approve a waitlisted application (flip to approved; converts on downstream step)
// ---------------------------------------------------------------------------

export async function approveWaitlistedApplication(
  application_id: string,
): Promise<WaitlistActionState> {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', application_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Application not found' }
  }

  const { error } = await supabase
    .from('enrollment_applications')
    .update({
      triage_status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: actorId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', application_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'waitlist_offer.approved',
    entityType: 'enrollment_application',
    entityId: application_id,
    before: { status: before.triage_status },
    after: { status: 'approved' },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  return { ok: true, id: application_id }
}

// ---------------------------------------------------------------------------
// Remove from waitlist (archive / reject)
// ---------------------------------------------------------------------------

export async function removeFromWaitlist(application_id: string): Promise<WaitlistActionState> {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: before } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', application_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Application not found' }
  }

  const { error } = await supabase
    .from('enrollment_applications')
    .update({
      triage_status: 'rejected',
      updated_at: new Date().toISOString(),
    })
    .eq('id', application_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'waitlist_offer.removed',
    entityType: 'enrollment_application',
    entityId: application_id,
    before: { status: before.triage_status },
    after: { status: 'rejected' },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  return { ok: true, id: application_id }
}

// ---------------------------------------------------------------------------
// Reorder waitlist (nudge triage_score ±1)
// ---------------------------------------------------------------------------

export async function reorderWaitlist(input: ReorderWaitlistInput): Promise<WaitlistActionState> {
  await assertRole('admin')

  const parsed = ReorderWaitlistSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }
  const { application_id, direction } = parsed.data

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: row } = await supabase
    .from('enrollment_applications')
    .select('id, triage_score')
    .eq('id', application_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!row) {
    return { ok: false, error: 'Application not found' }
  }

  const current = (row.triage_score as number | null) ?? 0
  // Higher score = earlier position. Move up => +1, move down => -1.
  const next = direction === 'up' ? current + 1 : current - 1

  const { error } = await supabase
    .from('enrollment_applications')
    .update({ triage_score: next, updated_at: new Date().toISOString() })
    .eq('id', application_id)
    .eq('tenant_id', tenantId)

  if (error) {
    return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'waitlist_offer.reordered',
    entityType: 'enrollment_application',
    entityId: application_id,
    before: { triage_score: current },
    after: { triage_score: next, direction },
  })

  revalidatePath('/portal/admin/enrollment/waitlist')
  return { ok: true, id: application_id }
}
