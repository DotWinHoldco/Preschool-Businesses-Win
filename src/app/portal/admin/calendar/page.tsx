// @anchor: cca.calendar.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import {
  CalendarClient,
  type CalendarEvent,
} from '@/components/portal/calendar/calendar-client'

export default async function AdminCalendarPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Compute start/end of the current month for filtering
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
    .toISOString()

  const { data: dbEvents } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('tenant_id', tenantId)
    .gte('start_at', startOfMonth)
    .lte('start_at', endOfMonth)
    .order('start_at')

  // Map DB rows to the CalendarEvent shape the client component expects
  const events: CalendarEvent[] = (dbEvents ?? []).map((e) => {
    const startDate = new Date(e.start_at)
    const endDate = e.end_at ? new Date(e.end_at) : null
    const pad = (n: number) => String(n).padStart(2, '0')
    const dateStr = `${startDate.getFullYear()}-${pad(startDate.getMonth() + 1)}-${pad(startDate.getDate())}`

    return {
      id: e.id,
      title: e.title,
      date: dateStr,
      time_start: e.all_day ? null : `${pad(startDate.getHours())}:${pad(startDate.getMinutes())}`,
      time_end: e.all_day || !endDate ? null : `${pad(endDate.getHours())}:${pad(endDate.getMinutes())}`,
      all_day: e.all_day ?? false,
      location: e.location ?? null,
      notes: e.notes ?? null,
    }
  })

  return (
    <div className="space-y-6">
      <div>
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-foreground)' }}
        >
          School Calendar
        </h1>
        <p
          className="text-sm mt-1"
          style={{ color: 'var(--color-muted-foreground)' }}
        >
          View and manage school events, closures, and activities.
        </p>
      </div>

      <CalendarClient initialEvents={events} />
    </div>
  )
}
