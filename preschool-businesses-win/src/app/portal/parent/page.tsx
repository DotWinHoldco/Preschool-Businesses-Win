// @anchor: cca.parent.dashboard
// Parent dashboard — my children, daily reports, quick actions.
// Uses placeholder data during Phase 1.

import {
  LogIn,
  MessageSquare,
  CreditCard,
  Heart,
  CalendarDays,
  CheckSquare,
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
  title: 'Parent Dashboard — Portal',
}

// ---------------------------------------------------------------------------
// Placeholder data
// ---------------------------------------------------------------------------

const MY_CHILDREN = [
  {
    id: 'stu-1',
    firstName: 'Sophia',
    lastName: 'Martinez',
    photoUrl: null,
    classroom: 'Butterfly Room',
    age: '4 years old',
    allergies: ['Peanuts'],
    checkedIn: true,
    checkedInAt: '7:45 AM',
  },
  {
    id: 'stu-2',
    firstName: 'Lucas',
    lastName: 'Martinez',
    photoUrl: null,
    classroom: 'Sunshine Room',
    age: '2 years old',
    allergies: [],
    checkedIn: false,
    checkedInAt: null,
  },
]

const DAILY_REPORT_PREVIEW = {
  childName: 'Sophia',
  date: 'Today',
  entries: [
    { type: 'meal', text: 'Ate most of her breakfast (oatmeal, fruit, milk)', time: '8:15 AM' },
    { type: 'activity', text: 'Loved finger painting during art centers', time: '9:30 AM' },
    { type: 'mood', text: 'Happy and energetic this morning', time: '10:00 AM' },
  ],
  published: false,
}

const UPCOMING_EVENTS = [
  { title: 'Pajama Day', date: 'This Friday', type: 'event' },
  { title: 'Parent-Teacher Conference', date: 'Next Tuesday', type: 'meeting' },
]

const CHECKLIST_ITEMS = [
  { title: 'Upload updated immunization records for Sophia', overdue: true },
  { title: 'Sign field trip permission slip — Science Museum', overdue: false },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ParentDashboardPage() {
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
          Here is what is happening with your family today.
        </p>
      </div>

      {/* Quick action buttons */}
      <div className="grid gap-3 grid-cols-3">
        {[
          { label: 'Check In', href: '/portal/parent/check-in', icon: LogIn },
          { label: 'Messages', href: '/portal/parent/messaging', icon: MessageSquare },
          { label: 'Billing', href: '/portal/parent/billing', icon: CreditCard },
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

      {/* My Children cards */}
      <div>
        <h2
          className="mb-4 text-lg font-semibold"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--color-foreground)' }}
        >
          My Children
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {MY_CHILDREN.map((child) => (
            <Card key={child.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  {/* Avatar placeholder */}
                  <div
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-xl font-bold"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
                      color: 'var(--color-primary)',
                    }}
                  >
                    {child.firstName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold" style={{ color: 'var(--color-foreground)' }}>
                        {child.firstName} {child.lastName}
                      </p>
                      {child.checkedIn ? (
                        <Badge variant="success" size="sm">Checked in</Badge>
                      ) : (
                        <Badge variant="outline" size="sm">Not checked in</Badge>
                      )}
                    </div>
                    <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
                      {child.classroom} &middot; {child.age}
                    </p>
                    {child.checkedInAt && (
                      <p className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                        Dropped off at {child.checkedInAt}
                      </p>
                    )}
                    {child.allergies.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {child.allergies.map((allergy) => (
                          <Badge key={allergy} variant="danger" size="sm">
                            {allergy}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Daily report preview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart size={18} style={{ color: 'var(--color-accent, var(--color-primary))' }} />
              Today&apos;s Report — {DAILY_REPORT_PREVIEW.childName}
            </CardTitle>
            <CardDescription>
              {DAILY_REPORT_PREVIEW.published
                ? 'Published'
                : 'In progress — updates throughout the day'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {DAILY_REPORT_PREVIEW.entries.map((entry, i) => (
                <li key={i} className="flex gap-3">
                  <span
                    className="mt-0.5 text-xs font-medium shrink-0 w-16"
                    style={{ color: 'var(--color-muted-foreground)' }}
                  >
                    {entry.time}
                  </span>
                  <span className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                    {entry.text}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Upcoming events + checklist items */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays size={18} style={{ color: 'var(--color-primary)' }} />
                Upcoming Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {UPCOMING_EVENTS.map((event, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between"
                  >
                    <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                      {event.title}
                    </p>
                    <span className="text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                      {event.date}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare size={18} style={{ color: 'var(--color-warning)' }} />
                Outstanding Items
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {CHECKLIST_ITEMS.map((item, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <div
                      className="mt-1 h-2 w-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor: item.overdue
                          ? 'var(--color-destructive)'
                          : 'var(--color-warning)',
                      }}
                    />
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-foreground)' }}>
                        {item.title}
                      </p>
                      {item.overdue && (
                        <p className="text-xs" style={{ color: 'var(--color-destructive)' }}>
                          Overdue
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
