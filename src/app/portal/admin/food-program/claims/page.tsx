// @anchor: cca.cacfp.claims-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { CACFPClaimReport } from '@/components/portal/food-program/cacfp-claim-report'
import { GenerateCACFPClaimDialog } from '@/components/portal/food-program/generate-cacfp-claim-dialog'
import { FileText } from 'lucide-react'

interface ClaimLine {
  id: string
  claim_id: string
  meal_type: string
  eligible_count: number
  claimed_count: number
  rate_cents: number
  subtotal_cents: number
}

export default async function ClaimsPage() {
  const supabase = await createTenantServerClient()

  const { data: claims } = await supabase
    .from('cacfp_claims')
    .select('*')
    .order('claim_year', { ascending: false })
    .order('claim_month', { ascending: false })

  const claimIds = (claims ?? []).map((c: Record<string, unknown>) => c.id as string)

  // Fetch all claim lines for the displayed claims in one query
  const { data: allLines } = claimIds.length
    ? await supabase
        .from('cacfp_claim_lines')
        .select(
          'id, claim_id, meal_type, eligible_count, claimed_count, rate_cents, subtotal_cents',
        )
        .in('claim_id', claimIds)
    : { data: [] as ClaimLine[] }

  const linesByClaim = new Map<string, ClaimLine[]>()
  for (const line of (allLines ?? []) as ClaimLine[]) {
    const key = line.claim_id
    if (!linesByClaim.has(key)) linesByClaim.set(key, [])
    linesByClaim.get(key)!.push(line)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">CACFP Claims</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Generate and manage monthly CACFP reimbursement claims
          </p>
        </div>
        <GenerateCACFPClaimDialog />
      </div>

      {(claims ?? []).length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">
            No claims yet
          </h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Generate your first monthly CACFP claim
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(claims ?? []).map((claim: Record<string, unknown>) => {
            const claimId = claim.id as string
            const lines = (linesByClaim.get(claimId) ?? []).map((l) => ({
              meal_type: l.meal_type,
              eligible_count: l.eligible_count,
              claimed_count: l.claimed_count,
              rate_cents: l.rate_cents,
              subtotal_cents: l.subtotal_cents,
            }))
            return (
              <CACFPClaimReport
                key={claimId}
                claim={{
                  id: claimId,
                  claim_month: claim.claim_month as number,
                  claim_year: claim.claim_year as number,
                  status: (claim.status as string) ?? 'draft',
                  total_meals_claimed: (claim.total_meals_claimed as number) ?? 0,
                  total_reimbursement_cents: (claim.total_reimbursement_cents as number) ?? 0,
                  submitted_at: claim.submitted_at as string | null,
                  paid_at: claim.paid_at as string | null,
                  paid_amount_cents: claim.paid_amount_cents as number | null,
                }}
                lines={lines}
              />
            )
          })}
        </div>
      )}
    </div>
  )
}
