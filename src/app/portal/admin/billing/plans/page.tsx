// @anchor: cca.billing.plans
// Billing plans management — real data from billing_plans, CRUD via PlanManager.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlanManager, type PlanRow } from '@/components/portal/billing/plan-manager'

export default async function BillingPlansPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: rows } = await supabase
    .from('billing_plans')
    .select(
      'id, name, description, amount_cents, frequency, program_type, age_group, registration_fee_cents, supply_fee_cents, late_fee_cents, late_fee_grace_days, sibling_discount_pct, staff_discount_pct, military_discount_pct, church_member_discount_pct, is_active',
    )
    .eq('tenant_id', tenantId)
    .order('is_active', { ascending: false })
    .order('amount_cents', { ascending: false })

  const plans: PlanRow[] = (rows ?? []).map((r) => ({
    id: r.id as string,
    name: (r.name as string) ?? '',
    description: (r.description as string | null) ?? null,
    amount_cents: (r.amount_cents as number) ?? 0,
    frequency: (r.frequency as string) ?? 'monthly',
    program_type: (r.program_type as string | null) ?? null,
    age_group: (r.age_group as string | null) ?? null,
    registration_fee_cents: (r.registration_fee_cents as number) ?? 0,
    supply_fee_cents: (r.supply_fee_cents as number) ?? 0,
    late_fee_cents: (r.late_fee_cents as number) ?? 0,
    late_fee_grace_days: (r.late_fee_grace_days as number) ?? 5,
    sibling_discount_pct: Number(r.sibling_discount_pct ?? 0),
    staff_discount_pct: Number(r.staff_discount_pct ?? 0),
    military_discount_pct: Number(r.military_discount_pct ?? 0),
    church_member_discount_pct: Number(r.church_member_discount_pct ?? 0),
    is_active: (r.is_active as boolean) ?? true,
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal/admin/billing"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to billing
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Billing Plans</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Manage tuition plans and pricing
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Plans</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <PlanManager plans={plans} />
        </CardContent>
      </Card>
    </div>
  )
}
