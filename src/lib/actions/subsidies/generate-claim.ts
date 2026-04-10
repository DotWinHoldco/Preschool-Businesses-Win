// @anchor: cca.subsidy.generate-claim
'use server'

import { GenerateSubsidyClaimSchema, type GenerateSubsidyClaimInput } from '@/lib/schemas/subsidy'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type GenerateSubsidyClaimState = {
  ok: boolean
  error?: string
  id?: string
  summary?: {
    total_claimed_cents: number
    line_count: number
  }
}

export async function generateSubsidyClaim(
  input: GenerateSubsidyClaimInput
): Promise<GenerateSubsidyClaimState> {
  await assertRole('admin')

  const parsed = GenerateSubsidyClaimSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch active family subsidies for this agency
  const { data: subsidies, error: subError } = await supabase
    .from('family_subsidies')
    .select('id, student_id, subsidy_rate_cents_per_day, authorized_days_per_week')
    .eq('agency_id', data.agency_id)
    .eq('status', 'active')

  if (subError) {
    return { ok: false, error: subError.message }
  }

  if (!subsidies || subsidies.length === 0) {
    return { ok: false, error: 'No active subsidies found for this agency' }
  }

  // For each subsidy, count attendance days in the period
  const claimLines: Array<{
    family_subsidy_id: string
    student_id: string
    days_claimed: number
    amount_claimed_cents: number
  }> = []

  for (const sub of subsidies) {
    const { data: attendance } = await supabase
      .from('attendance_records')
      .select('id')
      .eq('student_id', sub.student_id)
      .gte('date', data.claim_period_start)
      .lte('date', data.claim_period_end)
      .in('status', ['present', 'late'])

    const daysClaimed = attendance?.length ?? 0
    const amountClaimed = daysClaimed * (sub.subsidy_rate_cents_per_day ?? 0)

    if (daysClaimed > 0) {
      claimLines.push({
        family_subsidy_id: sub.id,
        student_id: sub.student_id,
        days_claimed: daysClaimed,
        amount_claimed_cents: amountClaimed,
      })
    }
  }

  const totalClaimedCents = claimLines.reduce((sum, l) => sum + l.amount_claimed_cents, 0)

  // Create claim
  const { data: claim, error: claimError } = await supabase
    .from('subsidy_claims')
    .insert({
      tenant_id: tenantId,
      agency_id: data.agency_id,
      claim_period_start: data.claim_period_start,
      claim_period_end: data.claim_period_end,
      status: 'draft',
      total_claimed_cents: totalClaimedCents,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (claimError || !claim) {
    return { ok: false, error: claimError?.message ?? 'Failed to create claim' }
  }

  // Insert claim lines
  if (claimLines.length > 0) {
    const rows = claimLines.map((l) => ({
      tenant_id: tenantId,
      claim_id: claim.id,
      family_subsidy_id: l.family_subsidy_id,
      student_id: l.student_id,
      days_claimed: l.days_claimed,
      amount_claimed_cents: l.amount_claimed_cents,
    }))

    await supabase.from('subsidy_claim_lines').insert(rows)
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'subsidy.claim.generated',
    entity_type: 'subsidy_claim',
    entity_id: claim.id,
    after: { agency_id: data.agency_id, total_claimed_cents: totalClaimedCents, lines: claimLines.length },
  })

  return {
    ok: true,
    id: claim.id,
    summary: { total_claimed_cents: totalClaimedCents, line_count: claimLines.length },
  }
}
