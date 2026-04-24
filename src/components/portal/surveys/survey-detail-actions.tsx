'use client'

// @anchor: cca.survey.detail-actions
// Wires Export PDF / Export CSV / Close Survey buttons on the survey detail page.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { closeSurvey, exportSurveyCSV } from '@/lib/actions/surveys/survey-actions'

type Props = {
  surveyId: string
  isArchived: boolean
}

export function SurveyDetailActions({ surveyId, isArchived }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  const handleCsv = () => {
    setErr(null)
    startTransition(async () => {
      const res = await exportSurveyCSV(surveyId)
      if (!res.ok || !res.csv) {
        setErr(res.error ?? 'Export failed')
        return
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename ?? 'survey.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  const handlePdf = () => {
    if (typeof window !== 'undefined') {
      window.alert('PDF export coming soon — use CSV for now')
    }
  }

  const handleClose = () => {
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Close this survey? Respondents will no longer be able to submit.')
    ) {
      return
    }
    setErr(null)
    startTransition(async () => {
      const res = await closeSurvey(surveyId)
      if (!res.ok) {
        setErr(res.error ?? 'Failed')
      } else {
        router.refresh()
      }
    })
  }

  return (
    <div className="flex flex-wrap gap-3">
      <button
        type="button"
        onClick={handlePdf}
        disabled={isPending}
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{
          backgroundColor: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
        }}
      >
        Export Results (PDF)
      </button>
      <button
        type="button"
        onClick={handleCsv}
        disabled={isPending}
        className="rounded-lg px-4 py-2 text-sm font-medium"
        style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
      >
        Export Results (CSV)
      </button>
      {!isArchived && (
        <button
          type="button"
          onClick={handleClose}
          disabled={isPending}
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-destructive)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          Close Survey
        </button>
      )}
      {err && (
        <span className="self-center text-xs" style={{ color: 'var(--color-destructive)' }}>
          {err}
        </span>
      )}
    </div>
  )
}
