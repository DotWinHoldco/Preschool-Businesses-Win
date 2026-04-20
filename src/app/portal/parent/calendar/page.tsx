// @anchor: cca.calendar.parent-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { CalendarDays, MapPin, Clock } from 'lucide-react'

export default async function ParentCalendarPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Get current month boundaries
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString()

  const monthLabel = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  // Fetch school-wide calendar events for the current month
  const { data: events } = await supabase
    .from('calendar_events')
    .select('id, title, description, event_type, start_at, end_at, all_day, location')
    .eq('tenant_id', tenantId)
    .eq('scope', 'school_wide')
    .gte('start_at', monthStart)
    .lte('start_at', monthEnd)
    .order('start_at', { ascending: true })

  const eventList = events ?? []

  function formatEventDate(dateStr: string, allDay: boolean) {
    const d = new Date(dateStr)
    if (allDay) {
      return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    }
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
  }

  function formatEventTime(startStr: string, endStr: string | null, allDay: boolean) {
    if (allDay) return 'All day'
    const start = new Date(startStr)
    const timeStr = start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    if (endStr) {
      const end = new Date(endStr)
      const endTimeStr = end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
      return `${timeStr} - ${endTimeStr}`
    }
    return timeStr
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          School Calendar
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          {monthLabel}
        </p>
      </div>

      {eventList.length > 0 ? (
        <div className="flex flex-col gap-3">
          {eventList.map((event) => (
            <div
              key={event.id}
              className="rounded-xl p-4"
              style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <CalendarDays size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold" style={{ color: 'var(--color-foreground)' }}>
                    {event.title}
                  </h3>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      <CalendarDays size={12} />
                      {formatEventDate(event.start_at, event.all_day ?? false)}
                    </span>
                    <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      <Clock size={12} />
                      {formatEventTime(event.start_at, event.end_at, event.all_day ?? false)}
                    </span>
                    {event.location && (
                      <span className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        <MapPin size={12} />
                        {event.location}
                      </span>
                    )}
                  </div>
                  {event.description && (
                    <p className="mt-2 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {event.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <div
            className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
            style={{ backgroundColor: 'var(--color-muted)' }}
          >
            <CalendarDays size={24} style={{ color: 'var(--color-muted-foreground)' }} />
          </div>
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No events this month.
          </p>
        </div>
      )}
    </div>
  )
}
