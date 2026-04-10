// @anchor: cca.staff.time-clock-page
// Staff time clock page.

import { TimeClockWidget } from '@/components/portal/staff/time-clock-widget'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function TimeClockPage() {
  // TODO: Fetch real user session + active time entry from Supabase
  const user = { id: 'staff-1', name: 'Jane Smith' }
  const activeEntry = null // No active entry = not clocked in

  // Recent time entries
  const recentEntries = [
    { id: '1', date: '2026-04-07', clockIn: '7:55 AM', clockOut: '4:10 PM', total: '7.8h' },
    { id: '2', date: '2026-04-04', clockIn: '7:50 AM', clockOut: '4:05 PM', total: '7.7h' },
    { id: '3', date: '2026-04-03', clockIn: '8:00 AM', clockOut: '4:30 PM', total: '8.0h' },
  ]

  return (
    <div className="flex flex-col gap-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Time Clock</h1>

      <TimeClockWidget
        userId={user.id}
        userName={user.name}
        activeEntry={activeEntry}
      />

      {/* Recent entries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Entries</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
}
