// @anchor: cca.accounting.exports-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { AccountingExport } from '@/components/portal/expenses/accounting-export'
import { FileSpreadsheet } from 'lucide-react'

export default async function ExportsPage() {
  const supabase = await createTenantServerClient()

  const { data: exports } = await supabase
    .from('accounting_exports')
    .select('*')
    .order('generated_at', { ascending: false })
    .limit(20)

  const mapped = (exports ?? []).map((e: Record<string, unknown>) => ({
    id: e.id as string,
    export_type: e.export_type as string,
    period_start: e.period_start as string,
    period_end: e.period_end as string,
    generated_at: (e.generated_at ?? e.created_at) as string,
    row_count: (e.row_count as number) ?? 0,
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <FileSpreadsheet className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Accounting Exports</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Export financial data for QuickBooks, Xero, or general ledger
        </p>
      </div>

      <AccountingExport exports={mapped} />
    </div>
  )
}
