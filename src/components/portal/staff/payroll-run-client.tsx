'use client'

// @anchor: cca.payroll.run-client
// Orchestrates the payroll wizard: Calculate → Preview → Submit → Approve.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  calculatePayroll,
  submitPayrollRun,
  approvePayrollRun,
  exportPayrollCsv,
  type PayrollPreviewLineItem,
} from '@/lib/actions/staff/payroll-run'

function formatCents(cents: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)
}

interface Props {
  defaultStart: string
  defaultEnd: string
}

export function PayrollRunClient({ defaultStart, defaultEnd }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [periodStart, setPeriodStart] = useState(defaultStart)
  const [periodEnd, setPeriodEnd] = useState(defaultEnd)
  const [lineItems, setLineItems] = useState<PayrollPreviewLineItem[] | null>(null)
  const [runId, setRunId] = useState<string | null>(null)
  const [status, setStatus] = useState<'preview' | 'draft' | 'approved'>('preview')
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const totalGrossCents = (lineItems ?? []).reduce((s, li) => s + li.gross_pay_cents, 0)
  const totalNetCents = (lineItems ?? []).reduce((s, li) => s + li.net_pay_cents, 0)

  const handleCalculate = () => {
    setError(null)
    setFlash(null)
    startTransition(async () => {
      const result = await calculatePayroll({
        period_start: periodStart,
        period_end: periodEnd,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed to calculate')
        setLineItems(null)
        return
      }
      setLineItems(result.line_items ?? [])
      setRunId(null)
      setStatus('preview')
      if ((result.line_items ?? []).length === 0) {
        setFlash('No time entries in this period.')
      }
    })
  }

  const handleSubmit = () => {
    if (!lineItems || lineItems.length === 0) return
    setError(null)
    startTransition(async () => {
      const result = await submitPayrollRun({
        period_start: periodStart,
        period_end: periodEnd,
        line_items: lineItems,
      })
      if (!result.ok) {
        setError(result.error ?? 'Failed to submit run')
        return
      }
      setRunId(result.id ?? null)
      setStatus('draft')
      setFlash('Payroll run saved as draft.')
    })
  }

  const handleApprove = () => {
    if (!runId) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Approve payroll run? This will lock it.')
    ) {
      return
    }
    setError(null)
    startTransition(async () => {
      const result = await approvePayrollRun(runId)
      if (!result.ok) {
        setError(result.error ?? 'Failed to approve run')
        return
      }
      setStatus('approved')
      setFlash('Payroll run approved.')
      router.refresh()
    })
  }

  const handleExport = () => {
    if (!runId) return
    startTransition(async () => {
      const result = await exportPayrollCsv(runId)
      if (!result.ok || !result.csv) {
        setError(result.error ?? 'Failed to export')
        return
      }
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? 'payroll.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setFlash('CSV downloaded.')
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Step 1: Select period */}
      <Card>
        <CardHeader>
          <CardTitle>1. Select Period</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label
                htmlFor="period-start"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                Period Start
              </label>
              <Input
                id="period-start"
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                inputSize="sm"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="period-end"
                className="block text-sm font-medium text-[var(--color-foreground)] mb-1"
              >
                Period End
              </label>
              <Input
                id="period-end"
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                inputSize="sm"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleCalculate}
                disabled={isPending || !periodStart || !periodEnd}
                loading={isPending && !lineItems}
              >
                Calculate
              </Button>
            </div>
          </div>
          {error && <p className="mt-3 text-sm text-[var(--color-destructive)]">{error}</p>}
          {flash && <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">{flash}</p>}
        </CardContent>
      </Card>

      {/* Step 2: Preview */}
      {lineItems && (
        <Card>
          <CardHeader>
            <CardTitle>
              2. Preview ({lineItems.length} staff · status: {status})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {lineItems.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">
                No payable time entries in this period.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-[var(--radius,0.75rem)] border border-[var(--color-border)]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-[var(--color-muted)]">
                      <th className="px-4 py-3 text-left font-semibold">Staff</th>
                      <th className="px-4 py-3 text-right font-semibold">Rate</th>
                      <th className="px-4 py-3 text-right font-semibold">Reg Hrs</th>
                      <th className="px-4 py-3 text-right font-semibold">OT Hrs</th>
                      <th className="px-4 py-3 text-right font-semibold">Gross</th>
                      <th className="px-4 py-3 text-right font-semibold">Taxes</th>
                      <th className="px-4 py-3 text-right font-semibold">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((li) => {
                      const taxes = li.federal_tax_cents + li.fica_cents + li.state_tax_cents
                      return (
                        <tr key={li.user_id} className="border-t border-[var(--color-border)]">
                          <td className="px-4 py-3 font-medium text-[var(--color-foreground)]">
                            {li.user_name}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                            ${li.hourly_rate.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                            {li.regular_hours.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                            {li.overtime_hours > 0 ? (
                              <span className="text-[var(--color-warning)]">
                                {li.overtime_hours.toFixed(2)}
                              </span>
                            ) : (
                              li.overtime_hours.toFixed(2)
                            )}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">
                            {formatCents(li.gross_pay_cents)}
                          </td>
                          <td className="px-4 py-3 text-right text-[var(--color-muted-foreground)]">
                            {formatCents(taxes)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-[var(--color-foreground)]">
                            {formatCents(li.net_pay_cents)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-[var(--color-border)] bg-[var(--color-muted)]/50">
                      <td className="px-4 py-3 font-bold" colSpan={4}>
                        Total
                      </td>
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCents(totalGrossCents)}
                      </td>
                      <td className="px-4 py-3 text-right font-bold" />
                      <td className="px-4 py-3 text-right font-bold">
                        {formatCents(totalNetCents)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Actions */}
      {lineItems && lineItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>3. Submit &amp; Approve</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            {status === 'preview' && (
              <Button onClick={handleSubmit} disabled={isPending} loading={isPending}>
                Submit Run (Draft)
              </Button>
            )}
            {status === 'draft' && runId && (
              <>
                <Button onClick={handleApprove} disabled={isPending} loading={isPending}>
                  Approve Payroll
                </Button>
                <Button variant="secondary" onClick={handleExport} disabled={isPending}>
                  Export Accounting CSV
                </Button>
              </>
            )}
            {status === 'approved' && runId && (
              <>
                <p className="text-sm text-[var(--color-primary)] font-semibold">Approved.</p>
                <Button variant="secondary" onClick={handleExport} disabled={isPending}>
                  Export Accounting CSV
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
