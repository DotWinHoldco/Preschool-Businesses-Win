// @anchor: cca.audit.log-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Pagination } from '@/components/ui/pagination'
import { parsePagination } from '@/lib/pagination'
import { AuditExportButton } from '@/components/portal/audit/audit-export-button'

export const metadata: Metadata = {
  title: 'Audit Log | Admin Portal',
  description: 'Immutable record of all system actions and state changes',
}

function first(v: string | string[] | undefined): string | undefined {
  if (!v) return undefined
  return Array.isArray(v) ? v[0] : v
}

export default async function AdminAuditLogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const sp = await searchParams
  const { page, perPage, offset } = parsePagination(sp)
  const supabase = await createTenantAdminClient(tenantId)

  const actionFilter = first(sp.action)
  const userFilter = first(sp.user)
  const entityFilter = first(sp.entity)
  const fromFilter = first(sp.from)
  const toFilter = first(sp.to)

  // Dynamic dropdown values — distinct actions and actors in this tenant.
  const [{ data: distinctActionsRaw }, { data: distinctUsersRaw }] = await Promise.all([
    supabase
      .from('audit_log')
      .select('action')
      .eq('tenant_id', tenantId)
      .not('action', 'is', null)
      .limit(5000),
    supabase
      .from('audit_log')
      .select('actor_id')
      .eq('tenant_id', tenantId)
      .not('actor_id', 'is', null)
      .limit(5000),
  ])

  const distinctActions = Array.from(
    new Set((distinctActionsRaw ?? []).map((r) => r.action as string).filter(Boolean)),
  ).sort()
  const distinctActorIds = Array.from(
    new Set((distinctUsersRaw ?? []).map((r) => r.actor_id as string).filter(Boolean)),
  )

  // Resolve actor names
  const actorMap: Record<string, string> = {}
  if (distinctActorIds.length > 0) {
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name')
      .in('id', distinctActorIds)
    for (const p of profiles ?? []) {
      actorMap[p.id] = p.full_name ?? 'Unknown'
    }
  }

  // Build the filtered query
  let q = supabase
    .from('audit_log')
    .select('*', { count: 'exact', head: false })
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  if (actionFilter) q = q.eq('action', actionFilter)
  if (userFilter) q = q.eq('actor_id', userFilter)
  if (entityFilter) q = q.ilike('entity_type', `%${entityFilter}%`)
  if (fromFilter) q = q.gte('created_at', fromFilter)
  if (toFilter) q = q.lte('created_at', toFilter)

  const { data: dbEntries, count } = await q.range(offset, offset + perPage - 1)

  const entries = dbEntries ?? []

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
      ? typeof entry.after_data === 'string'
        ? entry.after_data
        : JSON.stringify(entry.after_data)
      : entry.before_data
        ? typeof entry.before_data === 'string'
          ? entry.before_data
          : JSON.stringify(entry.before_data)
        : '—',
  }))

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            Audit Log
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Immutable, append-only record of every state change. Cannot be edited or deleted.
          </p>
        </div>
        <AuditExportButton
          filters={{
            action: actionFilter,
            user: userFilter,
            from: fromFilter,
            to: toFilter,
            entity: entityFilter,
          }}
        />
      </div>

      {/* Filters (GET form so the searchParams drive the query) */}
      <form
        method="GET"
        className="flex flex-wrap gap-3 rounded-xl p-4"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <select
          name="action"
          defaultValue={actionFilter ?? ''}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        >
          <option value="">All Actions</option>
          {distinctActions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          name="user"
          defaultValue={userFilter ?? ''}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        >
          <option value="">All Users</option>
          {distinctActorIds.map((id) => (
            <option key={id} value={id}>
              {actorMap[id] ?? id.slice(0, 8)}
            </option>
          ))}
        </select>
        <input
          type="date"
          name="from"
          defaultValue={fromFilter ?? ''}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        />
        <input
          type="date"
          name="to"
          defaultValue={toFilter ?? ''}
          className="rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        />
        <input
          type="text"
          name="entity"
          defaultValue={entityFilter ?? ''}
          placeholder="Entity type contains..."
          className="flex-1 rounded-lg border px-3 py-2 text-sm"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-background)',
            color: 'var(--color-foreground)',
          }}
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
          }}
        >
          Filter
        </button>
      </form>

      {/* Log entries */}
      <div
        className="overflow-hidden rounded-xl"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        {displayEntries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <p className="text-sm font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              No audit entries match the current filters.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Timestamp', 'Actor', 'Action', 'Entity', 'Details'].map((h) => (
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
                {displayEntries.map((entry) => (
                  <tr key={entry.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td
                      className="whitespace-nowrap px-4 py-3 font-mono text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {entry.timestamp}
                    </td>
                    <td
                      className="whitespace-nowrap px-4 py-3 font-medium"
                      style={{ color: 'var(--color-foreground)' }}
                    >
                      {entry.actor}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex rounded px-2 py-0.5 font-mono text-xs"
                        style={{
                          backgroundColor: 'var(--color-muted)',
                          color: 'var(--color-foreground)',
                        }}
                      >
                        {entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                      {entry.entity}
                    </td>
                    <td
                      className="max-w-xs truncate px-4 py-3 text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {entry.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination
        page={page}
        perPage={perPage}
        total={count ?? 0}
        basePath="/portal/admin/audit-log"
      />
    </div>
  )
}
