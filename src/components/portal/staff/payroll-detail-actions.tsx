'use client'

// @anchor: cca.payroll.detail-actions
// Approve + export actions on the payroll detail page.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { approvePayrollRun, exportPayrollCsv } from '@/lib/actions/staff/payroll-run'

interface Props {
  runId: string
  status: string
}

export function PayrollDetailActions({ runId, status }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)

  const handleApprove = () => {
    if (typeof window !== 'undefined' && !window.confirm('Approve payroll run?')) return
    setError(null)
    startTransition(async () => {
      const result = await approvePayrollRun(runId)
      if (!result.ok) {
        setError(result.error ?? 'Failed to approve')
        return
      }
      setFlash('Run approved.')
      router.refresh()
    })
  }

  const handleExport = () => {
    setError(null)
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
      a.download = result.filename ?? `payroll-${runId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setFlash('CSV downloaded.')
    })
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {status === 'draft' && (
        <Button onClick={handleApprove} disabled={isPending} loading={isPending}>
          Approve Payroll
        </Button>
      )}
      <Button variant="secondary" onClick={handleExport} disabled={isPending}>
        Export Accounting File (CSV)
      </Button>
      {error && <p className="text-sm text-[var(--color-destructive)]">{error}</p>}
      {flash && <p className="text-sm text-[var(--color-muted-foreground)]">{flash}</p>}
    </div>
  )
}
