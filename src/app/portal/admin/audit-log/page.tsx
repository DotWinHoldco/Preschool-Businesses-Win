// @anchor: cca.audit.log-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'

export const metadata: Metadata = {
  title: 'Audit Log | Admin Portal',
  description: 'Immutable record of all system actions and state changes',
}

export default async function AdminAuditLogPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch audit log entries
  const { data: dbEntries } = await supabase
    .from('audit_log')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const entries = dbEntries ?? []

  // Fetch actor names from user_profiles
  const actorIds = [...new Set(entries.map((e) => e.actor_id).filter(Boolean))]
  let actorMap: Record<string, string> = {}

  if (actorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', actorIds)

    for (const profile of profiles ?? []) {
      actorMap[profile.id] = profile.full_name ?? 'Unknown'
    }
  }

  // Map DB rows to display shape
  const displayEntries = entries.map((entry) => ({
    id: entry.id,
    timestamp: entry.created_at
      ? new Date(entry.created_at).toISOString().replace('T', ' ').slice(0, 19)
      : '—',
    actor: actorMap[entry.actor_id] ?? 'System',
    action: entry.action ?? '—',
    entity: entry.entity_type
      ? `${entry.entity_type}${entry.entity_id ? `: ${entry.entity_id}` : ''}`
      : '—',
    details: entry.after_data
      ? (typeof entry.after_data === 'string' ? entry.after_data : JSON.stringify(entry.after_data))
      : entry.before_data
        ? (typeof entry.before_data === 'string' ? entry.before_data : JSON.stringify(entry.before_data))
        : '—',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Audit Log
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Immutable, append-only record of every state change. Cannot be edited or deleted.
        </p>
      </div>

      {/* Filters */}
      <div
        className="flex flex-wrap gap-3 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        >
          <option>All Actions</option>
          <option>check_in</option>
          <option>check_out</option>
          <option>student.create</option>
          <option>student.update</option>
          <option>billing</option>
          <option>daily_report</option>
          <option>impersonation</option>
          <option>emergency</option>
        </select>
        <select
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        >
          <option>All Users</option>
        </select>
        <input
          type="date"
          className="rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        />
        <input
          type="text"
          placeholder="Search entities..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)', color: 'var(--color-foreground)' }}
        />
        <button
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          Filter
        </button>
      </div>

      {/* Log entries */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {displayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              No audit entries recorded yet.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Details'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {displayEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {entry.timestamp}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded px-2 py-0.5 font-mono text-xs"
                        style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>{entry.entity}</td>
                    <td className="max-w-xs truncate px-4 py-3 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Showing {displayEntries.length} entries
        </p>
        <div className="flex gap-2">
          <button
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Previous
          </button>
          <button
            className="rounded-lg px-3 py-1.5 text-sm"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
