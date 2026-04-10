// @anchor: cca.staff.dashboard
// Staff dashboard — my classrooms, schedule, quick actions.
// Uses placeholder data during Phase 1.

import {
  Clock,
  Users,
  FileText,
  ClipboardList,
  LogIn,
  CalendarDays,
} from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export const metadata = {
  title: 'Staff Dashboard — Portal',
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const MY_CLASSROOMS = [
  {
    id: 'cls-1',
    name: 'Butterfly Room',
    ageRange: '3-4 years',
    studentsToday: 12,
    capacity: 15,
    role: 'Lead Teacher',
  },
]

const TODAYS_SCHEDULE = [
  { time: '8:00 AM', activity: 'Arrival & Free Play', status: 'completed' as const },
  { time: '8:30 AM', activity: 'Circle Time', status: 'completed' as const },
  { time: '9:00 AM', activity: 'Learning Centers', status: 'in-progress' as const },
  { time: '9:45 AM', activity: 'Snack', status: 'upcoming' as const },
  { time: '10:15 AM', activity: 'Outdoor Play', status: 'upcoming' as const },
  { time: '11:00 AM', activity: 'Story Time', status: 'upcoming' as const },
  { time: '11:30 AM', activity: 'Lunch', status: 'upcoming' as const },
  { time: '12:00 PM', activity: 'Nap Time', status: 'upcoming' as const },
]

const CHECKED_IN_CHILDREN = [
  { name: 'Sophia M.', checkedInAt: '7:45 AM', allergies: ['Peanuts'] },
  { name: 'Liam J.', checkedInAt: '7:50 AM', allergies: [] },
  { name: 'Emma R.', checkedInAt: '7:55 AM', allergies: ['Dairy'] },
  { name: 'Noah T.', checkedInAt: '8:00 AM', allergies: [] },
  { name: 'Olivia S.', checkedInAt: '8:05 AM', allergies: ['Eggs', 'Tree nuts'] },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function StaffDashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1
          className="text-2xl font-bold tracking-tight md:text-3xl"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          Good morning
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
          Here is your day at a glance.
        </p>
      </div>

      {/* Quick action buttons */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Record Attendance', href: '/portal/staff/classroom/cls-1/attendance', icon: ClipboardList },
          { label: 'Daily Reports', href: '/portal/staff/classroom/cls-1/daily-reports', icon: FileText },
          { label: 'Time Clock', href: '/portal/staff/time-clock', icon: Clock },
        ].map((action) => {
          const Icon = action.icon
          return (
            <a
              key={action.href}
              href={action.href}
              className="flex flex-col items-center gap-2 rounded-[var(--radius)] border px-3 py-4 text-center text-sm font-medium transition-colors hover:bg-[var(--color-muted)]"
              style={{ borderColor: 'var(--color-border)', color: 'var(--color-foreground)' }}
            >
              <Icon size={22} style={{ color: 'var(--color-primary)' }} />
              <span>{action.label}</span>
            </a>
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* My Classrooms */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users size={18} style={{ color: 'var(--color-primary)' }} />
              My Classrooms Today
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {MY_CLASSROOMS.map((room) => (
              <a
                key={room.id}
                href={`/portal/staff/classroom/${room.id}`}
                className="block rounded-lg border p-4 transition-colors hover:bg-[var(--color-muted)]"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                      {room.name}
                    </p>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {room.ageRange} &middot; {room.role}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold" style={{ color: 'var(--color-foreground)' }}>
                      {room.studentsToday}/{room.capacity}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      students today
                    </p>
                  </div>
                </div>
              </a>
            ))}
          </CardContent>
        </Card>

        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
              Today&apos;s Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {TODAYS_SCHEDULE.map((item, i) => (
                <li key={i} className="flex items-center gap-3">
                  <span
                    className="w-16 shrink-0 text-xs font-medium"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {item.time}
                  </span>
                  <span
                    className="text-sm font-medium"
                    style={{
                      color:
                        item.status === 'completed'
                          ? 'var(--color-muted-foreground)'
                          : item.status === 'in-progress'
                            ? 'var(--color-primary)'
                            : 'var(--color-foreground)',
                      textDecoration: item.status === 'completed' ? 'line-through' : undefined,
                    }}
                  >
                    {item.activity}
                  </span>
                  {item.status === 'in-progress' && (
                    <Badge variant="default" size="sm">Now</Badge>
                  )}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Checked-in Children */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <LogIn size={18} style={{ color: 'var(--color-success)' }} />
              Children Checked In
            </CardTitle>
            <CardDescription>
              {CHECKED_IN_CHILDREN.length} of {MY_CLASSROOMS[0]?.capacity ?? 0} students
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {CHECKED_IN_CHILDREN.map((child) => (
                <div
                  key={child.name}
                  className="flex items-center justify-between rounded-lg border px-4 py-3"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {child.name}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      In at {child.checkedInAt}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {child.allergies.map((allergy) => (
                      <Badge key={allergy} variant="danger" size="sm">
                        {allergy}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
