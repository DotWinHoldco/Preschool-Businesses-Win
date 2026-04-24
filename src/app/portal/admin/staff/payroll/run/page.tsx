// @anchor: cca.payroll.run-wizard-page
// Payroll run wizard — real Calculate/Submit/Approve flow.

import Link from 'next/link'
import { PayrollRunClient } from '@/components/portal/staff/payroll-run-client'

export default function PayrollRunPage() {
  // Default to the prior 2 weeks, Monday-to-Sunday style bounds.
  const today = new Date()
  const end = new Date(today)
  const start = new Date(today)
  start.setDate(start.getDate() - 13)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link
          href="/portal/admin/staff/payroll"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to payroll
        </Link>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">New Payroll Run</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Calculate from time entries, preview, submit as draft, then approve.
        </p>
      </div>

      <PayrollRunClient defaultStart={fmt(start)} defaultEnd={fmt(end)} />
    </div>
  )
}
