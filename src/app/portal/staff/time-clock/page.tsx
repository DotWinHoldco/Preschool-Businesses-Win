// @anchor: cca.staff.time-clock-page
// Staff time clock page — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { TimeClockWidget } from '@/components/portal/staff/time-clock-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TimeClockPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const session = await getSession()
  if (!session) notFound()
  const userId = session.user.id

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch user profile for display name
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('first_name, last_name')
    .eq('id', userId)
    .single()

  const userName = profile
    ? `${profile.first_name ?? ''} ${profile.last_name ?? ''}`.trim() || 'Staff Member'
    : 'Staff Member'

  // Active time entry (not clocked out)
  const { data: activeEntryRow } = await supabase
    .from('time_entries')
    .select('id, clock_in_at, break_start_at, break_end_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .is('clock_out_at', null)
    .order('clock_in_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const activeEntry = activeEntryRow
    ? {
        id: activeEntryRow.id as string,
        clock_in_at: activeEntryRow.clock_in_at as string,
        break_start_at: activeEntryRow.break_start_at as string | null,
        break_end_at: activeEntryRow.break_end_at as string | null,
      }
    : null

  // Recent time entries (last 10, completed)
  const { data: recentRows } = await supabase
    .from('time_entries')
    .select('id, clock_in_at, clock_out_at')
    .eq('user_id', userId)
    .eq('tenant_id', tenantId)
    .not('clock_out_at', 'is', null)
    .order('clock_in_at', { ascending: false })
    .limit(10)

  const recentEntries = (recentRows ?? []).map((row: Record<string, unknown>) => {
    const clockIn = new Date(row.clock_in_at as string)
    const clockOut = new Date(row.clock_out_at as string)
    const diffMs = clockOut.getTime() - clockIn.getTime()
    const totalHours = (diffMs / 3600000).toFixed(1)

    return {
      id: row.id as string,
      date: clockIn.toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }),
      clockIn: clockIn.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      clockOut: clockOut.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
      total: `${totalHours}h`,
    }
  })

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Time Clock</h1>

      <TimeClockWidget
        userId={userId}
        userName={userName}
        activeEntry={activeEntry}
      />

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEntries.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">
              No recent time entries.
            </p>
          ) : (
            <div className="space-y-3">
              {recentEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--color-foreground)]">{entry.date}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {entry.clockIn} - {entry.clockOut}
                  </span>
                  <span className="font-medium text-[var(--color-foreground)]">{entry.total}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
