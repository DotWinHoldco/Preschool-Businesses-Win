// @anchor: cca.payroll.dashboard
// Payroll dashboard — list of payroll runs.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DollarSign } from 'lucide-react'

export default async function PayrollDashboardPage() {
  // TODO: Fetch payroll runs from Supabase
  const runs = [
    { id: '1', period: 'Mar 24 - Apr 6, 2026', status: 'paid', total_gross: 12450.00, staff_count: 8 },
    { id: '2', period: 'Mar 10 - Mar 23, 2026', status: 'exported', total_gross: 11980.00, staff_count: 8 },
    { id: '3', period: 'Feb 24 - Mar 9, 2026', status: 'paid', total_gross: 12100.00, staff_count: 7 },
  ]

  const statusVariant = (s: string) => {
    if (s === 'paid') return 'success' as const
    if (s === 'exported') return 'default' as const
    if (s === 'approved') return 'secondary' as const
    return 'outline' as const
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Payroll</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">Manage payroll runs</p>
        </div>
        <a
          href="/portal/admin/staff/payroll/run"
          className="inline-flex items-center gap-2 rounded-[var(--radius,0.75rem)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)] px-4 py-2 text-sm font-semibold min-h-[44px] hover:brightness-110 transition-all"
        >
          <DollarSign size={16} />
          New Payroll Run
        </a>
      </div>

      <div className="space-y-3">
        {runs.map((run) => (
          <Card key={run.id}>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">{run.period}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {run.staff_count} staff members
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-bold text-[var(--color-foreground)]">
                  ${run.total_gross.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
                <Badge variant={statusVariant(run.status)}>
                  {run.status}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
