// @anchor: cca.compliance.incidents-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { AlertTriangle } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import {
  IncidentCreateDialog,
  type ClassroomOpt,
} from '@/components/portal/compliance/incident-create-dialog'

type SP = Promise<Record<string, string | string[] | undefined>>

function getParam(sp: Record<string, string | string[] | undefined>, k: string): string | null {
  const v = sp[k]
  if (typeof v === 'string' && v.length > 0) return v
  return null
}

function severityVariant(
  s: string | null,
): 'default' | 'secondary' | 'warning' | 'danger' | 'outline' {
  switch (s) {
    case 'critical':
      return 'danger'
    case 'serious':
      return 'danger'
    case 'moderate':
      return 'warning'
    case 'minor':
      return 'secondary'
    default:
      return 'outline'
  }
}

function statusVariant(
  s: string | null,
): 'default' | 'secondary' | 'warning' | 'danger' | 'outline' {
  switch (s) {
    case 'open':
      return 'warning'
    case 'investigating':
      return 'warning'
    case 'escalated':
      return 'danger'
    case 'closed':
      return 'secondary'
    default:
      return 'outline'
  }
}

export default async function IncidentReportsPage({ searchParams }: { searchParams: SP }) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const sp = await searchParams
  const supabase = await createTenantAdminClient(tenantId)

  const status = getParam(sp, 'status')
  const severity = getParam(sp, 'severity')
  const from = getParam(sp, 'from')
  const to = getParam(sp, 'to')

  let q = supabase
    .from('incidents')
    .select(
      'id, incident_number, incident_date, incident_time, incident_type, severity, status, title, classroom_id, reported_by',
    )
    .eq('tenant_id', tenantId)
    .order('incident_date', { ascending: false })
    .limit(200)

  if (status) q = q.eq('status', status)
  if (severity) q = q.eq('severity', severity)
  if (from) q = q.gte('incident_date', from)
  if (to) q = q.lte('incident_date', to)

  const { data: rows } = await q
  const incidents = rows ?? []

  // Fetch classrooms for filter + labels + create dialog
  const { data: classroomData } = await supabase
    .from('classrooms')
    .select('id, name')
    .eq('tenant_id', tenantId)
    .order('name')
  const classrooms: ClassroomOpt[] = (classroomData ?? []).map((c) => ({ id: c.id, name: c.name }))
  const classroomMap = new Map(classrooms.map((c) => [c.id, c.name]))

  const reporterIds = [...new Set(incidents.map((i) => i.reported_by).filter(Boolean))] as string[]
  const reporterMap: Record<string, string> = {}
  if (reporterIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', reporterIds)
    for (const p of profiles ?? []) reporterMap[p.id] = p.full_name ?? 'Unknown'
  }

  const stats = {
    open: incidents.filter((i) => i.status === 'open').length,
    investigating: incidents.filter((i) => i.status === 'investigating').length,
    closed: incidents.filter((i) => i.status === 'closed').length,
    critical: incidents.filter((i) => i.severity === 'critical').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Incident Reports
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
            Document injuries, accidents, allegations, and other reportable events.
          </p>
        </div>
        <IncidentCreateDialog classrooms={classrooms} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {[
          { label: 'Open', value: stats.open },
          { label: 'Investigating', value: stats.investigating },
          { label: 'Closed', value: stats.closed },
          { label: 'Critical severity', value: stats.critical },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {s.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {s.value}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <form
        className="flex flex-wrap items-end gap-3 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Status
          </label>
          <select
            name="status"
            defaultValue={status ?? ''}
            className="rounded-lg border px-3 py-2 text-sm h-10"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          >
            <option value="">All</option>
            <option value="open">Open</option>
            <option value="investigating">Investigating</option>
            <option value="closed">Closed</option>
            <option value="escalated">Escalated</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            Severity
          </label>
          <select
            name="severity"
            defaultValue={severity ?? ''}
            className="rounded-lg border px-3 py-2 text-sm h-10"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          >
            <option value="">All</option>
            <option value="minor">Minor</option>
            <option value="moderate">Moderate</option>
            <option value="serious">Serious</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            From
          </label>
          <input
            type="date"
            name="from"
            defaultValue={from ?? ''}
            className="rounded-lg border px-3 py-2 text-sm h-10"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
            To
          </label>
          <input
            type="date"
            name="to"
            defaultValue={to ?? ''}
            className="rounded-lg border px-3 py-2 text-sm h-10"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-background)',
              color: 'var(--color-foreground)',
            }}
          />
        </div>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium h-10"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          Apply
        </button>
      </form>

      {/* Table */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {incidents.length === 0 ? (
          <div className="p-12 text-center">
            <AlertTriangle
              size={40}
              className="mx-auto mb-3"
              style={{ color: 'var(--color-muted-foreground)' }}
            />
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No incidents recorded.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {[
                    'Incident #',
                    'Date',
                    'Type',
                    'Severity',
                    'Status',
                    'Title',
                    'Classroom',
                    'Reported by',
                  ].map((h) => (
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
                {incidents.map((i) => (
                  <tr
                    key={i.id}
                    className="hover:bg-[var(--color-muted)] transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid var(--color-border)' }}
                  >
                    <td
                      className="px-4 py-3 font-mono text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        {i.incident_number ?? i.id.slice(0, 8)}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        {i.incident_date ? new Date(i.incident_date).toLocaleDateString() : '—'}
                        {i.incident_time ? ` ${String(i.incident_time).slice(0, 5)}` : ''}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        {i.incident_type}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        <Badge variant={severityVariant(i.severity)}>{i.severity}</Badge>
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        <Badge variant={statusVariant(i.status)}>{i.status}</Badge>
                      </Link>
                    </td>
                    <td
                      className="px-4 py-3 font-medium"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      <Link href={`/portal/admin/compliance/incidents/${i.id}`} className="block">
                        {i.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {i.classroom_id ? (classroomMap.get(i.classroom_id) ?? '—') : '—'}
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                      {i.reported_by ? (reporterMap[i.reported_by] ?? '—') : '—'}
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
