// @anchor: cca.emergency.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { EmergencyAdminPanel } from '@/components/portal/emergency/emergency-admin-panel'
import { Badge } from '@/components/ui/badge'

export default async function AdminEmergencyPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [eventsRes, drillsRes, musterRes, contactsRes] = await Promise.all([
    supabase
      .from('emergency_events')
      .select('id, event_type, severity, title, status, created_at')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false })
      .limit(100),
    supabase
      .from('emergency_drills')
      .select('id, drill_type, scheduled_at, completed_at, status, notes')
      .eq('tenant_id', tenantId)
      .order('scheduled_at', { ascending: false })
      .limit(20),
    supabase
      .from('emergency_muster_points')
      .select('id, name, location_description, capacity, is_primary, is_active')
      .eq('tenant_id', tenantId)
      .order('is_primary', { ascending: false })
      .order('name'),
    supabase
      .from('emergency_contacts')
      .select('id, contact_type, name, role, phone, phone_alt, email, is_active')
      .eq('tenant_id', tenantId)
      .order('sort_order')
      .order('name'),
  ])

  const events = eventsRes.data ?? []
  const drills = drillsRes.data ?? []
  const musterPoints = musterRes.data ?? []
  const contacts = contactsRes.data ?? []

  const activeEvents = events.filter((e) => e.status === 'active')
  const pastEvents = events.filter((e) => e.status !== 'active')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Emergency Controls
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          Initiate alerts, schedule drills, and manage muster points and contacts.
        </p>
      </div>

      <EmergencyAdminPanel
        activeEvents={activeEvents}
        recentDrills={drills}
        musterPoints={musterPoints}
        contacts={contacts}
      />

      {pastEvents.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold mb-3" style={{ color: 'var(--color-foreground)' }}>
            Event history
          </h2>
          <div
            className="overflow-hidden rounded-xl"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                    {['Date', 'Type', 'Title', 'Severity', 'Status'].map((h) => (
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
                  {pastEvents.map((e) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td className="px-4 py-3" style={{ color: 'var(--color-foreground)' }}>
                        {e.created_at ? new Date(e.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-4 py-3" style={{ color: 'var(--color-muted-foreground)' }}>
                        {e.event_type}
                      </td>
                      <td
                        className="px-4 py-3 font-medium"
                        style={{ color: 'var(--color-foreground)' }}
                      >
                        {e.title}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            e.severity === 'critical'
                              ? 'danger'
                              : e.severity === 'advisory'
                                ? 'warning'
                                : 'outline'
                          }
                        >
                          {e.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            e.status === 'all_clear' || e.status === 'resolved'
                              ? 'secondary'
                              : 'outline'
                          }
                        >
                          {e.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
