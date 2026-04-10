// @anchor: cca.accounting.export-dialog
import { cn } from '@/lib/cn'
import { Download, FileSpreadsheet } from 'lucide-react'

interface AccountingExportProps {
  exports: Array<{
    id: string
    export_type: string
    period_start: string
    period_end: string
    generated_at: string
    row_count: number
  }>
  onExport?: (type: string, periodStart: string, periodEnd: string) => void
}

const exportTypeLabels: Record<string, string> = {
  quickbooks_csv: 'QuickBooks Online',
  xero_csv: 'Xero',
  general_ledger: 'General Ledger',
}

export function AccountingExport({ exports, onExport }: AccountingExportProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)] mb-1">Accounting Export</h2>
        <p className="text-sm text-[var(--color-muted-foreground)] mb-4">
          Export expenses and revenue data for your accounting software
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          {Object.entries(exportTypeLabels).map(([key, label]) => (
            <button
              key={key}
              onClick={() => onExport?.(key, '', '')}
              className="flex items-center gap-3 rounded-[var(--radius)] border border-[var(--color-border)] p-4 text-left hover:border-[var(--color-primary)] hover:bg-[var(--color-primary)]/5 transition-colors"
            >
              <FileSpreadsheet className="h-8 w-8 text-[var(--color-primary)]" />
              <div>
                <p className="text-sm font-medium text-[var(--color-foreground)]">{label}</p>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {key === 'quickbooks_csv' ? 'QBO import format' : key === 'xero_csv' ? 'Xero import format' : 'Standard GL format'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Recent exports */}
      {exports.length > 0 && (
        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
          <div className="p-4 border-b border-[var(--color-border)]">
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">Recent Exports</h3>
          </div>
          <div className="divide-y divide-[var(--color-border)]">
            {exports.map((exp) => (
              <div key={exp.id} className="flex items-center justify-between p-3">
                <div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {exportTypeLabels[exp.export_type] ?? exp.export_type}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)]">
                    {exp.period_start} to {exp.period_end} | {exp.row_count} rows
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--color-muted-foreground)]">
                    {new Date(exp.generated_at).toLocaleDateString()}
                  </span>
                  <button className="rounded p-1 text-[var(--color-primary)] hover:bg-[var(--color-primary)]/10 transition-colors">
                    <Download className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
