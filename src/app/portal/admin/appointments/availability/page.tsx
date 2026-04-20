// @anchor: cca.appointments.admin-availability

import { createTenantServerClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'
import { AvailabilityClient } from '@/components/portal/appointments/availability-client'

const DOW_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default async function AvailabilityPage() {
  const supabase = await createTenantServerClient()

  const { data: availability } = await supabase
    .from('staff_availability')
    .select('*')
    .order('user_id')
    .order('day_of_week')

  const { data: overrides } = await supabase
    .from('staff_availability_overrides')
    .select('*')
    .gte('date', new Date().toISOString().slice(0, 10))
    .order('date')

  const { data: connections } = await supabase
    .from('calendar_connections')
    .select('*')
    .order('updated_at', { ascending: false })

  const byStaff = new Map<string, Array<Record<string, unknown>>>()
  for (const row of availability ?? []) {
    const userId = row.user_id as string
    if (!byStaff.has(userId)) byStaff.set(userId, [])
    byStaff.get(userId)!.push(row)
  }

  const staffEntries = Array.from(byStaff.entries()).map(([userId, rows]) => ({
    userId,
    rows: rows.map((r) => ({
      day: DOW_LABELS[r.day_of_week as number],
      start: (r.start_time as string).slice(0, 5),
      end: (r.end_time as string).slice(0, 5),
    })),
  }))

  const overrideList = (overrides ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    date: o.date as string,
    isAvailable: o.is_available as boolean,
    reason: (o.reason as string | null) ?? null,
    userId: (o.user_id as string).slice(0, 8),
  }))

  const connectionList = (connections ?? []).map((c: Record<string, unknown>) => ({
    id: c.id as string,
    provider: c.provider as string,
    calendarName: (c.calendar_name as string | null) ?? (c.calendar_id as string | null) ?? 'primary',
    status: c.status as string,
    lastSynced: c.last_synced_at ? new Date(c.last_synced_at as string).toLocaleString() : 'never',
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Clock className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Staff Availability</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Weekly patterns, date overrides, and connected calendars.
        </p>
      </div>

      <AvailabilityClient
        staffEntries={staffEntries}
        overrides={overrideList}
        connections={connectionList}
      />
    </div>
  )
}
