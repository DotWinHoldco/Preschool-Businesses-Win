'use client'

// @anchor: platform.form-builder.response-detail-drawer
// Click-to-view detail for a single form response + admin annotation editor.

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogOverlay, DialogClose } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  setResponseAnnotation,
  deleteResponse,
  exportResponsesCSV,
} from '@/lib/actions/forms/response-actions'

type FieldMeta = {
  id: string
  label: string
  field_key: string
}

type ResponseRow = {
  id: string
  respondent_name: string | null
  respondent_email: string | null
  status: string | null
  completed_at: string | null
  created_at: string | null
}

type AnnotationRow = {
  response_id: string
  status: string
  notes: string | null
}

type Props = {
  formId: string
  fields: FieldMeta[]
  responses: ResponseRow[]
  valuesByResponse: Record<string, Record<string, unknown>>
  annotationsByResponse: Record<string, AnnotationRow | null>
}

function fmt(d: string | null): string {
  if (!d) return '—'
  try {
    return new Date(d).toLocaleString()
  } catch {
    return d
  }
}

export function ResponseDetailDrawer({
  formId,
  fields,
  responses,
  valuesByResponse,
  annotationsByResponse,
}: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState<'open' | 'follow_up' | 'reviewed' | 'archived'>('open')
  const [isPending, startTransition] = useTransition()
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedId) return
    const a = annotationsByResponse[selectedId]
    setNotes(a?.notes ?? '')
    setStatus((a?.status as 'open' | 'follow_up' | 'reviewed' | 'archived') ?? 'open')
  }, [selectedId, annotationsByResponse])

  const handleOpenRow = (id: string) => {
    setSelectedId(id)
    setOpen(true)
    setErr(null)
  }

  const handleSaveAnnotation = () => {
    if (!selectedId) return
    setErr(null)
    startTransition(async () => {
      const res = await setResponseAnnotation(selectedId, { status, notes: notes || null })
      if (!res.ok) setErr(res.error ?? 'Failed')
      else router.refresh()
    })
  }

  const handleDelete = () => {
    if (!selectedId) return
    if (
      typeof window !== 'undefined' &&
      !window.confirm('Delete this response? This cannot be undone.')
    )
      return
    setErr(null)
    startTransition(async () => {
      const res = await deleteResponse(selectedId)
      if (!res.ok) setErr(res.error ?? 'Failed')
      else {
        setOpen(false)
        router.refresh()
      }
    })
  }

  const handleExport = () => {
    setErr(null)
    startTransition(async () => {
      const res = await exportResponsesCSV(formId)
      if (!res.ok || !res.csv) {
        setErr(res.error ?? 'Export failed')
        return
      }
      const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = res.filename ?? 'responses.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }

  const selected = selectedId ? responses.find((r) => r.id === selectedId) : null
  const selectedValues = selectedId ? (valuesByResponse[selectedId] ?? {}) : {}

  return (
    <>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" size="sm" onClick={handleExport} disabled={isPending}>
          Export CSV
        </Button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {['Respondent', 'Status', 'Submitted', 'Review', ''].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left font-medium"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {responses.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center px-4 py-8"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  No responses yet.
                </td>
              </tr>
            ) : (
              responses.map((r) => {
                const a = annotationsByResponse[r.id]
                return (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium">
                        {r.respondent_name || r.respondent_email || 'Anonymous'}
                      </p>
                      {r.respondent_email && r.respondent_name && (
                        <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                          {r.respondent_email}
                        </p>
                      )}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {r.status ?? '—'}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {fmt(r.completed_at ?? r.created_at)}
                    </td>
                    <td
                      className="px-4 py-3 text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {a?.status ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button size="sm" variant="secondary" onClick={() => handleOpenRow(r.id)}>
                        View
                      </Button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogOverlay onClick={() => setOpen(false)} />
        <DialogContent
          title={selected?.respondent_name || selected?.respondent_email || 'Response'}
          description={selected ? fmt(selected.completed_at ?? selected.created_at) : undefined}
          className="max-w-2xl max-h-[85vh] overflow-y-auto"
        >
          <DialogClose onClick={() => setOpen(false)} />
          {selected ? (
            <div className="space-y-6">
              <section className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Submitted Values
                </h3>
                <dl className="space-y-2">
                  {fields.map((f) => {
                    const v = selectedValues[f.id]
                    return (
                      <div
                        key={f.id}
                        className="rounded-md p-3"
                        style={{ border: '1px solid var(--color-border)' }}
                      >
                        <dt
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          {f.label || f.field_key}
                        </dt>
                        <dd
                          className="mt-1 text-sm whitespace-pre-wrap break-words"
                          style={{ color: 'var(--color-foreground)' }}
                        >
                          {v === null || v === undefined || v === '' ? (
                            <span style={{ color: 'var(--color-muted-foreground)' }}>—</span>
                          ) : typeof v === 'object' ? (
                            JSON.stringify(v)
                          ) : (
                            String(v)
                          )}
                        </dd>
                      </div>
                    )
                  })}
                </dl>
              </section>

              <section className="space-y-3">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                  Admin Review
                </h3>
                <label className="block">
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Status
                  </span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'open' | 'follow_up' | 'reviewed' | 'archived')
                    }
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                  >
                    <option value="open">Open</option>
                    <option value="follow_up">Follow up</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="block">
                  <span
                    className="text-xs font-medium"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    Notes
                  </span>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                    className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
                    style={{
                      borderColor: 'var(--color-border)',
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-foreground)',
                    }}
                  />
                </label>
                {err && (
                  <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                    {err}
                  </p>
                )}
                <div className="flex flex-wrap justify-between gap-2">
                  <Button variant="danger" size="sm" onClick={handleDelete} disabled={isPending}>
                    Delete Response
                  </Button>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                    <Button size="sm" onClick={handleSaveAnnotation} disabled={isPending}>
                      Save Review
                    </Button>
                  </div>
                </div>
              </section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}
