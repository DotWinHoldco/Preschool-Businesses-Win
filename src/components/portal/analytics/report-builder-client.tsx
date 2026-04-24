'use client'

// @anchor: cca.analytics.report-builder-client
// Client wrapper for the custom report builder — Run / Save / Edit / Delete / Schedule.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  runReport,
  saveReport,
  updateReport,
  deleteReport,
  scheduleReport,
  type ReportConfig,
} from '@/lib/actions/analytics/report-builder'

type SavedReportRow = {
  id: string
  name: string
  entity_type: string | null
  is_scheduled: boolean | null
  created_at: string | null
  filters: Record<string, unknown> | null
}

type Props = {
  savedReports: SavedReportRow[]
  entityOptions: string[]
}

const DATE_RANGES = ['week', 'month', 'quarter', 'year', 'all'] as const
const FORMATS = ['table', 'csv'] as const

export function ReportBuilderClient({ savedReports, entityOptions }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const [editingId, setEditingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [dataSource, setDataSource] = useState(entityOptions[0] ?? 'students')
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]>('month')
  const [groupBy, setGroupBy] = useState('')
  const [format, setFormat] = useState<(typeof FORMATS)[number]>('table')

  const [rows, setRows] = useState<Array<Record<string, unknown>> | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const currentConfig = (): ReportConfig => ({
    name: name || undefined,
    data_source: dataSource,
    date_range: dateRange,
    group_by: groupBy || null,
    format,
  })

  const handleRun = () => {
    setErr(null)
    setRows(null)
    startTransition(async () => {
      const res = await runReport(currentConfig())
      if (!res.ok) {
        setErr(res.error ?? 'Run failed')
        return
      }
      if (format === 'csv' && res.csv) {
        const blob = new Blob([res.csv], { type: 'text/csv;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = res.filename ?? 'report.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
      setRows(res.rows ?? [])
    })
  }

  const handleSave = () => {
    setErr(null)
    const n = name.trim()
    if (!n) {
      setErr('Give your report a name before saving.')
      return
    }
    startTransition(async () => {
      const payload = {
        name: n,
        data_source: dataSource,
        date_range: dateRange,
        group_by: groupBy || null,
        format,
      }
      const res = editingId ? await updateReport(editingId, payload) : await saveReport(payload)
      if (!res.ok) {
        setErr(res.error ?? 'Save failed')
      } else {
        setEditingId(null)
        setName('')
        router.refresh()
      }
    })
  }

  const handleEdit = (r: SavedReportRow) => {
    setEditingId(r.id)
    setName(r.name)
    setDataSource(r.entity_type ?? entityOptions[0] ?? 'students')
    const f = (r.filters ?? {}) as Record<string, unknown>
    setDateRange((f.date_range as (typeof DATE_RANGES)[number]) ?? 'month')
    setGroupBy((f.group_by as string) ?? '')
    setFormat((f.format as (typeof FORMATS)[number]) ?? 'table')
  }

  const handleDelete = (id: string) => {
    if (typeof window !== 'undefined' && !window.confirm('Delete this saved report?')) return
    setErr(null)
    startTransition(async () => {
      const res = await deleteReport(id)
      if (!res.ok) setErr(res.error ?? 'Delete failed')
      else router.refresh()
    })
  }

  const handleSchedule = (id: string) => {
    const cron =
      typeof window !== 'undefined'
        ? window.prompt('Cron expression (e.g. "0 9 * * 1" for Mondays at 9am):')
        : null
    if (!cron) return
    setErr(null)
    startTransition(async () => {
      const res = await scheduleReport(id, cron)
      if (!res.ok) setErr(res.error ?? 'Schedule failed')
      else router.refresh()
    })
  }

  return (
    <div className="space-y-6">
      <div
        className="rounded-xl p-6"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            {editingId ? 'Edit Report' : 'Build a Report'}
          </h2>
          {editingId && (
            <button
              type="button"
              onClick={() => {
                setEditingId(null)
                setName('')
              }}
              className="text-xs"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <label className="block">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q1 Attendance"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            />
          </label>
          <label className="block">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Data Source
            </span>
            <select
              value={dataSource}
              onChange={(e) => setDataSource(e.target.value)}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            >
              {entityOptions.map((e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Date Range
            </span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as (typeof DATE_RANGES)[number])}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            >
              {DATE_RANGES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Group By (column)
            </span>
            <input
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
              placeholder="(optional)"
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            />
          </label>
          <label className="block">
            <span
              className="text-xs font-medium"
              style={{ color: 'var(--color-muted-foreground)' }}
            >
              Format
            </span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as (typeof FORMATS)[number])}
              className="mt-1 w-full rounded-lg border px-3 py-2 text-sm"
              style={{
                borderColor: 'var(--color-border)',
                backgroundColor: 'var(--color-background)',
                color: 'var(--color-foreground)',
              }}
            >
              {FORMATS.map((f) => (
                <option key={f} value={f}>
                  {f === 'table' ? 'Table' : 'CSV download'}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleRun}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-primary)',
              color: 'var(--color-primary-foreground)',
            }}
          >
            Run Report
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            {editingId ? 'Save Changes' : 'Save Report'}
          </button>
          {err && (
            <span className="self-center text-xs" style={{ color: 'var(--color-destructive)' }}>
              {err}
            </span>
          )}
        </div>

        {rows && (
          <div className="mt-6 overflow-x-auto">
            <p className="text-xs mb-2" style={{ color: 'var(--color-muted-foreground)' }}>
              {rows.length} rows
            </p>
            {rows.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {Object.keys(rows[0]).map((h) => (
                      <th
                        key={h}
                        className="px-2 py-1 text-left font-medium"
                        style={{ color: 'var(--color-muted-foreground)' }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 200).map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {Object.keys(rows[0]).map((h) => (
                        <td key={h} className="px-2 py-1 text-xs">
                          {r[h] === null || r[h] === undefined
                            ? '—'
                            : typeof r[h] === 'object'
                              ? JSON.stringify(r[h])
                              : String(r[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No rows matched.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Saved reports */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="p-4">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            Saved Reports
          </h2>
        </div>
        {savedReports.length === 0 ? (
          <div className="px-4 pb-6 text-center">
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No saved reports yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Name', 'Data Source', 'Scheduled', 'Created', 'Actions'].map((h) => (
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
                {savedReports.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {r.name}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.entity_type ?? '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.is_scheduled ? 'Yes' : 'No'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleEdit(r)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-primary)' }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSchedule(r.id)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-muted-foreground)' }}
                        >
                          Schedule
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(r.id)}
                          className="text-xs font-medium"
                          style={{ color: 'var(--color-destructive)' }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
