// @anchor: cca.payroll.run-wizard
// Payroll run wizard page — select period, review, and generate.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PayrollTable } from '@/components/portal/staff/payroll-table'
import { PayrollActions } from '@/components/portal/staff/payroll-actions'

export default async function PayrollRunPage() {
  // TODO: This would be a client-side wizard with steps
  // For now, show the payroll summary view

  const lineItems = [
    { id: '1', user_name: 'Jane Smith', regular_hours: 78.5, overtime_hours: 2.0, regular_pay: 1413.00, overtime_pay: 54.00, pto_hours: 0, pto_pay: 0, gross_pay: 1467.00, net_pay: 1467.00 },
    { id: '2', user_name: 'Maria Garcia', regular_hours: 80.0, overtime_hours: 0, regular_pay: 1280.00, overtime_pay: 0, pto_hours: 0, pto_pay: 0, gross_pay: 1280.00, net_pay: 1280.00 },
    { id: '3', user_name: 'Tom Wilson', regular_hours: 40.0, overtime_hours: 0, regular_pay: 560.00, overtime_pay: 0, pto_hours: 0, pto_pay: 0, gross_pay: 560.00, net_pay: 560.00 },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <a
          href="/portal/admin/staff/payroll"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to payroll
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">New Payroll Run</h1>
      </div>

      {/* Step 1: Select period */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col sm:flex-row gap-4">
            <label className="flex-1">
              <span className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Period Start</span>
              <input
                type="date"
                name="period_start"
                defaultValue="2026-03-24"
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm min-h-[44px]"
              />
            </label>
            <label className="flex-1">
              <span className="block text-sm font-medium text-[var(--color-foreground)] mb-1">Period End</span>
              <input
                type="date"
                name="period_end"
                defaultValue="2026-04-06"
                className="w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-transparent px-3 py-2.5 text-sm min-h-[44px]"
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                className="rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2.5 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
              >
                Calculate
              </button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Step 2: Review */}
      <PayrollTable
        periodStart="Mar 24, 2026"
        periodEnd="Apr 6, 2026"
        status="draft"
        lineItems={lineItems}
        totalGross={3307.00}
        totalNet={3307.00}
      />

      {/* Step 3: Actions */}
      <PayrollActions />
    </div>
  )
}
