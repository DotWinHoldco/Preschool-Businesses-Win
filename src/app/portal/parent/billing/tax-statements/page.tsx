// @anchor: cca.billing.tax-statements-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Tax Statements | Parent Portal',
  description: 'Download annual tax statements for dependent-care FSA and child-care tax credits',
}

export default function ParentBillingTaxStatementsPage() {
  const schoolInfo = {
    name: 'Crandall Christian Academy',
    ein: '12-3456789',
    address: '123 Main Street, Crandall, TX 75114',
  }

  const mockStatements = [
    {
      year: 2025,
      totalPaid: '$13,440.00',
      children: ['Sophia Martinez', 'Lucas Martinez'],
      generatedDate: 'January 15, 2026',
      available: true,
    },
    {
      year: 2024,
      totalPaid: '$7,200.00',
      children: ['Sophia Martinez'],
      generatedDate: 'January 12, 2025',
      available: true,
    },
  ]

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
        <dl className="mt-3 grid gap-2 sm:grid-cols-3">
          <div>
            <dt className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Provider Name</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{schoolInfo.name}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>EIN / Tax ID</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{schoolInfo.ein}</dd>
          </div>
          <div>
            <dt className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>Address</dt>
            <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{schoolInfo.address}</dd>
          </div>
        </dl>
      </div>

      {/* Statements */}
      {mockStatements.map((stmt) => (
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
              <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                Generated {stmt.generatedDate}
              </p>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {stmt.totalPaid}
            </p>
          </div>
          <div className="mt-3">
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>Children Covered</p>
            <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
              {stmt.children.join(', ')}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              Download PDF
            </button>
            <button
              className="rounded-lg px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
            >
              Email to Me
            </button>
          </div>
        </div>
      ))}

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
