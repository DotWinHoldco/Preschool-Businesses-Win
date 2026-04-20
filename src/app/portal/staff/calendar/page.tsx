// @anchor: cca.calendar.staff-page
// Staff calendar — real events from Supabase.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CalendarDays } from 'lucide-react'

export default async function StaffCalendarPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Current month range
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Get assigned classrooms for filtering classroom-scoped events
  const { data: assignments } = await supabase
    .from('classroom_staff_assignments')
    .select('classroom_id')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)

  const classroomIds = (assignments ?? []).map((a: Record<string, unknown>) => a.classroom_id as string)

  // Fetch events for the current month
  const { data: eventRows } = await supabase
    .from('calendar_events')
    .select('id, title, description, start_at, end_at, scope, classroom_id, location')
    .eq('tenant_id', tenantId)
    .gte('start_at', monthStart.toISOString())
    .lte('start_at', monthEnd.toISOString())
    .in('scope', ['school_wide', 'classroom', 'staff_only'])
    .order('start_at', { ascending: true })

  // Filter: school_wide and staff_only always visible; classroom events only if in assigned classrooms
  const events = (eventRows ?? []).filter((e: Record<string, unknown>) => {
    const scope = e.scope as string
    if (scope === 'school_wide' || scope === 'staff_only') return true
    if (scope === 'classroom' && classroomIds.includes(e.classroom_id as string)) return true
    return false
  }).map((e: Record<string, unknown>) => {
    const startDate = new Date(e.start_at as string)
    const endDate = e.end_at ? new Date(e.end_at as string) : null

    return {
      id: e.id as string,
      title: e.title as string,
      description: (e.description as string) ?? '',
      date: startDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      time: endDate
        ? `${startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })} - ${endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`
        : startDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      scope: e.scope as string,
      location: (e.location as string) ?? '',
    }
  })

  const scopeColors: Record<string, string> = {
    school_wide: 'var(--color-primary)',
    staff_only: 'var(--color-warning)',
    classroom: 'var(--color-success)',
  }

  const scopeLabels: Record<string, string> = {
    school_wide: 'School-Wide',
    staff_only: 'Staff Only',
    classroom: 'Classroom',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Staff Calendar
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {monthLabel}
        </p>
      </div>

      {events.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <CalendarDays size={32} className="mx-auto mb-2" style={{ color: 'var(--color-muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No events this month.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      {event.title}
                    </h3>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{
                        backgroundColor: scopeColors[event.scope] ?? 'var(--color-muted)',
                        color: 'var(--color-primary-foreground)',
                      }}
                    >
                      {scopeLabels[event.scope] ?? event.scope}
                    </span>
                  </div>
                  {event.description && (
                    <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {event.description}
                    </p>
                  )}
                  {event.location && (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      Location: {event.location}
                    </p>
                  )}
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {event.date}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {event.time}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
