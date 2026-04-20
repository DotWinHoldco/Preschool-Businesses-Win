// @anchor: cca.cacfp.generate-claim
'use server'

import { GenerateCACFPClaimSchema, type GenerateCACFPClaimInput } from '@/lib/schemas/food-program'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type GenerateCACFPClaimState = {
  ok: boolean
  error?: string
  id?: string
  summary?: {
    total_meals_claimed: number
    total_reimbursement_cents: number
    lines: Array<{
      meal_type: string
      eligible_count: number
      claimed_count: number
      rate_cents: number
      subtotal_cents: number
    }>
  }
}

// Current CACFP reimbursement rates (federal, updated annually)
const CACFP_RATES_CENTS: Record<string, { free: number; reduced: number; paid: number }> = {
  breakfast: { free: 210, reduced: 181, paid: 35 },
  lunch: { free: 394, reduced: 354, paid: 37 },
  supper: { free: 394, reduced: 354, paid: 37 },
  am_snack: { free: 109, reduced: 54, paid: 9 },
  pm_snack: { free: 109, reduced: 54, paid: 9 },
}

export async function generateCACFPClaim(
  input: GenerateCACFPClaimInput
): Promise<GenerateCACFPClaimState> {
  await assertRole('admin')

  const parsed = GenerateCACFPClaimSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Build date range for the claim month
  const monthStr = String(data.claim_month).padStart(2, '0')
  const periodStart = `${data.claim_year}-${monthStr}-01`
  const lastDay = new Date(data.claim_year, data.claim_month, 0).getDate()
  const periodEnd = `${data.claim_year}-${monthStr}-${String(lastDay).padStart(2, '0')}`

  // Fetch all meal service records for the month where served = true
  const { data: records, error: recordsError } = await supabase
    .from('meal_service_records')
    .select('meal_type, student_id, served')
    .gte('date', periodStart)
    .lte('date', periodEnd)
    .eq('served', true)

  if (recordsError) {
    return { ok: false, error: recordsError.message }
  }

  // Aggregate by meal type
  const mealCounts: Record<string, number> = {}
  for (const r of records ?? []) {
    const mt = r.meal_type as string
    mealCounts[mt] = (mealCounts[mt] || 0) + 1
  }

  // Build claim lines (using "free" tier rate as default -- admin adjusts per actual tier mix)
  const lines = Object.entries(mealCounts).map(([mealType, count]) => {
    const rates = CACFP_RATES_CENTS[mealType] ?? { free: 0, reduced: 0, paid: 0 }
    const rateCents = rates.free
    return {
      meal_type: mealType,
      eligible_count: count,
      claimed_count: count,
      rate_cents: rateCents,
      subtotal_cents: count * rateCents,
    }
  })

  const totalMealsClaimed = lines.reduce((sum, l) => sum + l.claimed_count, 0)
  const totalReimbursementCents = lines.reduce((sum, l) => sum + l.subtotal_cents, 0)

  // Create claim record
  const { data: claim, error: claimError } = await supabase
    .from('cacfp_claims')
    .insert({
      tenant_id: tenantId,
      claim_month: data.claim_month,
      claim_year: data.claim_year,
      status: 'draft',
      total_meals_claimed: totalMealsClaimed,
      total_reimbursement_cents: totalReimbursementCents,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (claimError || !claim) {
    return { ok: false, error: claimError?.message ?? 'Failed to create claim' }
  }

  // Insert claim lines
  if (lines.length > 0) {
    const claimLines = lines.map((l) => ({
      tenant_id: tenantId,
      claim_id: claim.id,
      meal_type: l.meal_type,
      eligible_count: l.eligible_count,
      claimed_count: l.claimed_count,
      rate_cents: l.rate_cents,
      subtotal_cents: l.subtotal_cents,
    }))

    await supabase.from('cacfp_claim_lines').insert(claimLines)
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'food_program.cacfp_claim.generated',
    entity_type: 'cacfp_claim',
    entity_id: claim.id,
    after_data: { month: data.claim_month, year: data.claim_year, total_meals: totalMealsClaimed },
  })

  return {
    ok: true,
    id: claim.id,
    summary: { total_meals_claimed: totalMealsClaimed, total_reimbursement_cents: totalReimbursementCents, lines },
  }
}
