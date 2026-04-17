// @anchor: cca.appointments.admin-availability

import { createTenantServerClient } from '@/lib/supabase/server'
import { Clock } from 'lucide-react'

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

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Weekly Patterns
        </h2>
        {byStaff.size === 0 ? (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            No staff availability configured yet. Use the setStaffAvailability server action to
            define a recurring weekly schedule.
          </div>
        ) : (
          <ul className="space-y-3">
            {Array.from(byStaff.entries()).map(([userId, rows]) => (
              <li key={userId} className="rounded-[var(--radius)] border border-[var(--color-border)] p-3">
                <div className="mb-2 text-sm font-medium text-[var(--color-foreground)]">
                  Staff {userId.slice(0, 8)}
                </div>
                <ul className="space-y-1 text-xs">
                  {rows.map((r, i) => (
                    <li key={i} className="text-[var(--color-muted-foreground)]">
                      {DOW_LABELS[r.day_of_week as number]} · {(r.start_time as string).slice(0, 5)}–{(r.end_time as string).slice(0, 5)}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Upcoming Overrides
        </h2>
        {overrides && overrides.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {overrides.map((o: Record<string, unknown>) => (
              <li key={o.id as string} className="flex items-center justify-between">
                <span>
                  {o.date as string} —{' '}
                  {(o.is_available as boolean) ? 'Open' : 'Blocked'}
                  {o.reason ? ` (${o.reason as string})` : ''}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {(o.user_id as string).slice(0, 8)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            No overrides scheduled.
          </div>
        )}
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
          Calendar Connections
        </h2>
        {connections && connections.length > 0 ? (
          <ul className="space-y-2 text-sm">
            {connections.map((c: Record<string, unknown>) => (
              <li key={c.id as string} className="flex items-center justify-between">
                <span>
                  {c.provider as string} — {(c.calendar_name as string | null) ?? (c.calendar_id as string | null) ?? 'primary'}
                </span>
                <span className="text-xs text-[var(--color-muted-foreground)]">
                  {(c.status as string)} · last synced{' '}
                  {c.last_synced_at ? new Date(c.last_synced_at as string).toLocaleString() : 'never'}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="text-sm text-[var(--color-muted-foreground)]">
            No calendars connected. Admins can connect Google, Outlook, or Apple CalDAV.
          </div>
        )}
      </div>
    </div>
  )
}
