'use client'

// @anchor: cca.analytics.csv-export-button
// Generic CSV export button that invokes a passed server action and downloads the result.

import { useState, useTransition } from 'react'

type CsvAction = () => Promise<{ ok: boolean; csv?: string; filename?: string; error?: string }>

type Props = {
  action: CsvAction
  label?: string
  fallbackFilename?: string
}

export function CsvExportButton({
  action,
  label = 'Export CSV',
  fallbackFilename = 'export.csv',
}: Props) {
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const handle = () => {
    setErr(null)
    startTransition(async () => {
      const res = await action()
      if (!res.ok || !res.csv) {
        setErr(res.error ?? 'Export failed')
        return
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename ?? fallbackFilename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handle}
        disabled={isPending}
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
      >
        {label}
      </button>
      {err && (
        <span className="text-xs" style={{ color: 'var(--color-destructive)' }}>
          {err}
        </span>
      )}
    </span>
  )
}
