// @anchor: cca.calendar.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  CalendarClient,
  type CalendarEvent,
  type CalendarClassroomOption,
} from '@/components/portal/calendar/calendar-client'

export default async function AdminCalendarPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Compute start/end of the current month for filtering
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const [{ data: dbEvents }, { data: classrooms }] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .eq('tenant_id', tenantId)
      .gte('start_at', startOfMonth)
      .lte('start_at', endOfMonth)
      .order('start_at'),
    supabase.from('classrooms').select('id, name').eq('tenant_id', tenantId).order('name'),
  ])

  // Map DB rows to the CalendarEvent shape the client component expects
  const events: CalendarEvent[] = (dbEvents ?? []).map((e) => {
    const startDate = new Date(e.start_at)
    const endDate = e.end_at ? new Date(e.end_at) : null
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`

    return {
      id: e.id,
      title: e.title,
      description: e.description ?? null,
      event_type: e.event_type ?? 'other',
      date: dateStr,
      start_at: e.start_at,
      end_at: e.end_at ?? null,
      time_start: e.all_day ? null : `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`,
      time_end:
        e.all_day || !endDate ? null : `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
      all_day: e.all_day ?? false,
      location: e.location ?? null,
      notes: e.notes ?? null,
      scope: e.scope ?? 'school_wide',
      classroom_id: e.classroom_id ?? null,
      requires_rsvp: e.requires_rsvp ?? false,
      requires_permission_slip: e.requires_permission_slip ?? false,
      max_participants: e.max_participants ?? null,
      cost_per_child_cents: e.cost_per_child_cents ?? null,
    }
  })

  const classroomOptions: CalendarClassroomOption[] = (classrooms ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          School Calendar
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          View and manage school events, closures, and activities.
        </p>
      </div>

      <CalendarClient initialEvents={events} classrooms={classroomOptions} />
    </div>
  )
}
