// @anchor: cca.subsidy.claims-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { ReconciliationBoard } from '@/components/portal/subsidies/reconciliation-board'
import { GenerateSubsidyClaimDialog } from '@/components/portal/subsidies/generate-subsidy-claim-dialog'
import { SubsidyClaimRowActions } from '@/components/portal/subsidies/subsidy-claim-row-actions'
import { FileText } from 'lucide-react'

export default async function SubsidyClaimsPage() {
  const supabase = await createTenantServerClient()

  const [claimsResp, agenciesResp] = await Promise.all([
    supabase
      .from('subsidy_claims')
      .select('*, subsidy_agencies(name)')
      .order('claim_period_start', { ascending: false }),
    supabase.from('subsidy_agencies').select('id, name').order('name'),
  ])

  const claims = claimsResp.data ?? []
  const agencies = (agenciesResp.data ?? []).map((a: Record<string, unknown>) => ({
    id: a.id as string,
    name: a.name as string,
  }))

  const mapped = (claims ?? []).map((c: Record<string, unknown>) => {
    const agency = c.subsidy_agencies as Record<string, unknown> | null
    return {
      id: c.id as string,
      agency_name: (agency?.name as string) ?? 'Unknown',
      claim_period_start: c.claim_period_start as string,
      claim_period_end: c.claim_period_end as string,
      status: (c.status as string) ?? 'draft',
      total_claimed_cents: (c.total_claimed_cents as number) ?? 0,
      total_paid_cents: c.total_paid_cents as number | null,
    }
  })

  const outstanding = mapped
    .filter((c) => c.status === 'submitted' || c.status === 'partially_paid')
    .reduce((s, c) => s + c.total_claimed_cents - (c.total_paid_cents ?? 0), 0)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Subsidy Claims</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Generate claims, track payments, and reconcile subsidies
          </p>
        </div>
        <GenerateSubsidyClaimDialog agencies={agencies} />
      </div>

      <ReconciliationBoard
        claims={mapped}
        totalOutstanding={outstanding}
        renderActions={(claim) => <SubsidyClaimRowActions claim={claim} />}
      />
    </div>
  )
}
