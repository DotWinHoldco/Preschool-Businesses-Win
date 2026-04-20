// @anchor: cca.billing.tax-statements-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { FileText } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Tax Statements | Parent Portal',
  description: 'Download annual tax statements for dependent-care FSA and child-care tax credits',
}

export default async function ParentBillingTaxStatementsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Get families this user belongs to
  const { data: memberships } = await supabase
    .from('family_members')
    .select('family_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
  const familyIds = memberships?.map(m => m.family_id) ?? []

  // Fetch paid invoices grouped by year
  const { data: paidInvoices } = familyIds.length > 0
    ? await supabase
        .from('invoices')
        .select('id, total_cents, paid_at')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
        .eq('status', 'paid')
        .not('paid_at', 'is', null)
        .order('paid_at', { ascending: false })
    : { data: [] }

  // Group by year and compute totals
  const yearMap = new Map<number, number>()
  for (const inv of paidInvoices ?? []) {
    if (!inv.paid_at) continue
    const year = new Date(inv.paid_at).getFullYear()
    yearMap.set(year, (yearMap.get(year) ?? 0) + inv.total_cents)
  }

  const statements = Array.from(yearMap.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([year, totalCents]) => ({ year, totalCents }))

  // Fetch tenant info for provider details
  const { data: tenant } = await supabase
    .from('tenants')
    .select('name')
    .eq('id', tenantId)
    .single()

  function fmt(cents: number) {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Tax Statements
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Annual statements for dependent-care FSA claims and child-care tax credits (IRS Form 2441).
        </p>
      </div>

      {/* School info */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Provider Information
        </h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Provider Name</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{tenant?.name ?? 'Your School'}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>EIN / Tax ID</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Contact school for EIN</dd>
          </div>
        </dl>
      </div>

      {/* Statements */}
      {statements.length > 0 ? (
        statements.map((stmt) => (
          <div
            key={stmt.year}
            className="rounded-xl p-5"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Tax Year {stmt.year}
                </h2>
              </div>
              <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                {fmt(stmt.totalCents)}
              </p>
            </div>
          </div>
        ))
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <FileText size={24} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No tax statements available yet.
          </p>
          <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
            Statements will appear here once you have paid invoices on record.
          </p>
        </div>
      )}

      {/* Help text */}
      <div
        className="rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-muted)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          These statements can be used to claim the Child and Dependent Care Tax Credit (IRS Form 2441)
          or to submit to your employer&apos;s Dependent Care Flexible Spending Account (DCFSA).
          Please consult your tax advisor for specific filing guidance.
        </p>
      </div>
    </div>
  )
}
