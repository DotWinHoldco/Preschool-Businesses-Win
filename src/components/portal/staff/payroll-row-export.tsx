'use client'

// @anchor: cca.payroll.row-export
// "Export Accounting File" button used on each completed payroll row.

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { exportPayrollCsv } from '@/lib/actions/staff/payroll-run'

interface Props {
  runId: string
}

export function PayrollRowExport({ runId }: Props) {
  const [isPending, startTransition] = useTransition()

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      const result = await exportPayrollCsv(runId)
      if (!result.ok || !result.csv) return
      const blob = new Blob([result.csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = result.filename ?? `payroll-${runId}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  return (
    <Button size="sm" variant="secondary" onClick={handleClick} disabled={isPending}>
      Export
    </Button>
  )
}
