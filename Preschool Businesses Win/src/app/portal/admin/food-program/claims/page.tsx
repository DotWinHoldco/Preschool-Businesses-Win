// @anchor: cca.cacfp.claims-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { CACFPClaimReport } from '@/components/portal/food-program/cacfp-claim-report'
import { FileText, Plus } from 'lucide-react'

export default async function ClaimsPage() {
  const supabase = await createTenantServerClient()

  const { data: claims } = await supabase
    .from('cacfp_claims')
    .select('*')
    .order('claim_year', { ascending: false })
    .order('claim_month', { ascending: false })

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
        <button className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity">
          <Plus className="h-4 w-4" /> Generate Claim
        </button>
      </div>

      {(claims ?? []).length === 0 ? (
        <div className="rounded-[var(--radius)] border border-dashed border-[var(--color-border)] p-12 text-center">
          <FileText className="mx-auto h-10 w-10 text-[var(--color-muted-foreground)] mb-3" />
          <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">No claims yet</h3>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Generate your first monthly CACFP claim
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {(claims ?? []).map((claim: Record<string, unknown>) => (
            <CACFPClaimReport
              key={claim.id as string}
              claim={{
                id: claim.id as string,
                claim_month: claim.claim_month as number,
                claim_year: claim.claim_year as number,
                status: (claim.status as string) ?? 'draft',
                total_meals_claimed: (claim.total_meals_claimed as number) ?? 0,
                total_reimbursement_cents: (claim.total_reimbursement_cents as number) ?? 0,
                submitted_at: claim.submitted_at as string | null,
                paid_at: claim.paid_at as string | null,
                paid_amount_cents: claim.paid_amount_cents as number | null,
              }}
              lines={[]}
            />
          ))}
        </div>
      )}
    </div>
  )
}
