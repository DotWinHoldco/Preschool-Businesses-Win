'use client'

// @anchor: cca.audit.export-button

import { useState, useTransition } from 'react'
import { exportAuditCSV } from '@/lib/actions/audit/export-audit'

type Props = {
  filters: { action?: string; user?: string; from?: string; to?: string; entity?: string }
}

export function AuditExportButton({ filters }: Props) {
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const handle = () => {
    setErr(null)
    startTransition(async () => {
      const res = await exportAuditCSV(filters)
      if (!res.ok || !res.csv) {
        setErr(res.error ?? 'Export failed')
        return
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename ?? 'audit-log.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  return (
    <>
      <button
        type="button"
        onClick={handle}
        disabled={isPending}
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
      >
        Export CSV
      </button>
      {err && (
        <span className="self-center text-xs" style={{ color: 'var(--color-destructive)' }}>
          {err}
        </span>
      )}
    </>
  )
}
