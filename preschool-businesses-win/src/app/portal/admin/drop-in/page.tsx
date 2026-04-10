// @anchor: cca.dropin.admin-page
// Admin drop-in scheduling — manage availability, view bookings, and configure rates.

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { CalendarClock, Users, DollarSign, Calendar } from 'lucide-react'

export default function AdminDropInPage() {
  // TODO: Fetch drop-in data from Supabase
  const stats = [
    { label: 'Open Slots Today', value: '6', icon: CalendarClock },
    { label: 'Bookings This Week', value: '14', icon: Calendar },
    { label: 'Revenue This Month', value: '$840', icon: DollarSign },
    { label: 'Active Drop-in Families', value: '9', icon: Users },
  ]

  const todayBookings = [
    { id: '1', student: 'Ava Thompson', classroom: 'Butterfly Room', type: 'Full Day', status: 'confirmed' },
    { id: '2', student: 'Jackson Lee', classroom: 'Sunshine Room', type: 'Half Day (AM)', status: 'confirmed' },
    { id: '3', student: 'Mia Garcia', classroom: 'Rainbow Room', type: 'Full Day', status: 'confirmed' },
  ]

  const upcomingAvailability = [
    { date: '2026-04-09', classrooms: 3, slotsRemaining: 8 },
    { date: '2026-04-10', classrooms: 3, slotsRemaining: 5 },
    { date: '2026-04-11', classrooms: 2, slotsRemaining: 3 },
    { date: '2026-04-14', classrooms: 3, slotsRemaining: 10 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
          Drop-in Scheduling
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Manage drop-in day availability, view bookings, and configure rates per classroom.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label}>
              <CardContent className="flex items-center gap-4 p-6">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <Icon size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    {stat.label}
                  </p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s Drop-in Bookings</CardTitle>
            <CardDescription>Students booked for drop-in care today.</CardDescription>
          </CardHeader>
          <CardContent>
            {todayBookings.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                No drop-in bookings for today.
              </p>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {todayBookings.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div>
                      <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {booking.student}
                      </p>
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        {booking.classroom} &middot; {booking.type}
                      </p>
                    </div>
                    <span
                      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                      style={{ backgroundColor: 'var(--color-success, #10B981)', color: '#fff' }}
                    >
                      Confirmed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Availability */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Availability</CardTitle>
            <CardDescription>Open drop-in slots for the next few days.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {upcomingAvailability.map((day) => (
                <div key={day.date} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-medium text-sm" style={{ color: 'var(--color-foreground)' }}>
                      {day.date}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {day.classrooms} classrooms open
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: day.slotsRemaining <= 3 ? 'var(--color-warning, #F59E0B)' : 'var(--color-muted)',
                      color: day.slotsRemaining <= 3 ? '#fff' : 'var(--color-muted-foreground)',
                    }}
                  >
                    {day.slotsRemaining} slots
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
