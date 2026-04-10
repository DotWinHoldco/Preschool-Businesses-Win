// @anchor: cca.student.parent-detail-page

import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Child Detail | Parent Portal',
  description: 'View your child\'s profile, classroom, and daily activity',
}

export default async function ParentChildDetailPage({
  params,
}: {
  params: Promise<{ studentId: string }>
}) {
  const { studentId } = await params

  const mockChild = {
    id: studentId,
    firstName: 'Sophia',
    lastName: 'Martinez',
    age: '3 years, 8 months',
    dob: 'July 15, 2022',
    classroom: 'Butterfly Room',
    teacher: 'Sarah Johnson',
    enrollmentStatus: 'Active',
    enrollmentDate: 'August 2025',
    allergies: [
      { name: 'Peanuts', severity: 'severe' as const },
      { name: 'Tree Nuts', severity: 'moderate' as const },
    ],
    emergencyContacts: [
      { name: 'Jane Martinez (Mom)', phone: '(555) 123-4567', primary: true },
      { name: 'Carlos Martinez (Dad)', phone: '(555) 234-5678', primary: false },
      { name: 'Rosa Martinez (Grandmother)', phone: '(555) 345-6789', primary: false },
    ],
  }

  const mockRecentActivity = [
    { date: 'Today', type: 'Check-in', detail: 'Checked in at 7:15 AM by Mom (QR)' },
    { date: 'Yesterday', type: 'Daily Report', detail: 'Great day! Loved art time. Ate most of lunch.' },
    { date: 'Yesterday', type: 'Check-out', detail: 'Checked out at 5:30 PM by Dad' },
    { date: 'April 6', type: 'Milestone', detail: 'Can write first name independently!' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {mockChild.firstName} {mockChild.lastName}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {mockChild.age} &middot; {mockChild.classroom} &middot; {mockChild.enrollmentStatus}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href={`/portal/parent/children/${studentId}/daily-reports`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            Daily Reports
          </a>
          <a
            href={`/portal/parent/children/${studentId}/medical`}
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
          >
            Medical Info
          </a>
        </div>
      </div>

      {/* Profile card */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Profile
          </h2>
          <dl className="mt-3 space-y-2">
            {[
              ['Date of Birth', mockChild.dob],
              ['Age', mockChild.age],
              ['Classroom', mockChild.classroom],
              ['Lead Teacher', mockChild.teacher],
              ['Enrolled Since', mockChild.enrollmentDate],
            ].map(([label, value]) => (
              <div key={label} className="flex justify-between">
                <dt className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>{label}</dt>
                <dd className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{value}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Allergies */}
        <div
          className="rounded-xl p-5"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
            Allergies & Alerts
          </h2>
          {mockChild.allergies.length > 0 ? (
            <div className="mt-3 space-y-2">
              {mockChild.allergies.map((a) => (
                <div
                  key={a.name}
                  className="flex items-center gap-3 rounded-lg p-2"
                  style={{
                    backgroundColor: a.severity === 'severe' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  }}
                >
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-bold"
                    style={{
                      backgroundColor: a.severity === 'severe' ? 'var(--color-destructive)' : 'var(--color-warning)',
                      color: 'var(--color-primary-foreground)',
                    }}
                  >
                    {a.severity.toUpperCase()}
                  </span>
                  <span className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>{a.name}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>No known allergies.</p>
          )}
        </div>
      </div>

      {/* Emergency contacts */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Emergency Contacts
        </h2>
        <div className="mt-3 space-y-2">
          {mockChild.emergencyContacts.map((c) => (
            <div key={c.name} className="flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                  {c.name} {c.primary && <span className="text-xs" style={{ color: 'var(--color-primary)' }}>(Primary)</span>}
                </p>
              </div>
              <a href={`tel:${c.phone}`} className="text-sm" style={{ color: 'var(--color-primary)' }}>{c.phone}</a>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider" style={{ color: 'var(--color-muted-foreground)' }}>
          Recent Activity
        </h2>
        <div className="mt-3 space-y-3">
          {mockRecentActivity.map((activity, i) => (
            <div key={i} className="flex gap-4" style={{ borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem' }}>
              <span className="w-20 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>{activity.date}</span>
              <span
                className="w-24 rounded-full px-2 py-0.5 text-center text-xs font-medium"
                style={{ backgroundColor: 'var(--color-muted)', color: 'var(--color-foreground)' }}
              >
                {activity.type}
              </span>
              <span className="flex-1 text-sm" style={{ color: 'var(--color-foreground)' }}>{activity.detail}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
