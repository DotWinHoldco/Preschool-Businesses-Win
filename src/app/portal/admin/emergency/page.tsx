// @anchor: cca.emergency.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ShieldAlert } from 'lucide-react'

export default async function AdminEmergencyPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: events } = await supabase
    .from('emergency_events')
    .select('id, event_type, severity, title, description, initiated_by, status, all_clear_message, notes, created_at')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const allEvents = events ?? []

  function severityColor(severity: string | null): string {
    switch (severity) {
      case 'critical': return 'var(--color-destructive)'
      case 'high': return 'var(--color-warning)'
      case 'medium': return 'var(--color-warning)'
      default: return 'var(--color-muted-foreground)'
    }
  }

  function statusColor(status: string | null): string {
    switch (status) {
      case 'active': return 'var(--color-destructive)'
      case 'resolved': return 'var(--color-primary)'
      case 'all_clear': return 'var(--color-primary)'
      default: return 'var(--color-warning)'
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Emergency Controls
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage emergency alerts, drill schedules, and emergency contacts.
        </p>
      </div>

      {allEvents.length === 0 ? (
        <div
          className="rounded-xl p-12 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <ShieldAlert
            size={48}
            className="mx-auto mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
            No emergency events recorded.
          </p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            Emergency events and drill records will appear here.
          </p>
        </div>
      ) : (
        <>
          {/* Summary stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total Events', value: allEvents.length.toString() },
              { label: 'Active', value: allEvents.filter((e) => e.status === 'active').length.toString() },
              { label: 'Resolved', value: allEvents.filter((e) => e.status === 'resolved' || e.status === 'all_clear').length.toString() },
              { label: 'Critical', value: allEvents.filter((e) => e.severity === 'critical').length.toString() },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4"
                style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
              >
                <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>{stat.label}</p>
                <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Events table */}
          <div
            className="overflow-hidden rounded-xl"
            style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
          >
            <div className="p-4">
              <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
                Emergency Events
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Date', 'Type', 'Title', 'Severity', 'Status', 'Notes'].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allEvents.map((evt) => (
                    <tr key={evt.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                        {evt.created_at ? new Date(evt.created_at).toLocaleDateString() : '\u2014'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>{evt.event_type ?? '\u2014'}</td>
                      <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-foreground)' }}>{evt.title ?? '\u2014'}</td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: severityColor(evt.severity) + '20',
                            color: severityColor(evt.severity),
                          }}
                        >
                          {evt.severity ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex rounded-full px-2 py-0.5 text-xs font-medium"
                          style={{
                            backgroundColor: statusColor(evt.status) + '20',
                            color: statusColor(evt.status),
                          }}
                        >
                          {evt.status ?? 'unknown'}
                        </span>
                      </td>
                      <td className="px-4 py-3 max-w-xs truncate" style={{ color: 'var(--color-muted-foreground)' }}>{evt.notes ?? '\u2014'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
