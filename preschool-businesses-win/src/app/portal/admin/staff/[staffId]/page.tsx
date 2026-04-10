// @anchor: cca.staff.admin-detail
// Staff detail page — profile, certs, schedule, time entries.

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CertStatusBadge } from '@/components/portal/staff/cert-status-badge'
import { ScheduleGrid } from '@/components/portal/staff/schedule-grid'

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>
}) {
  const { staffId } = await params

  // TODO: Fetch staff profile, certs, schedule, and time entries from Supabase
  const staff = {
    id: staffId,
    name: 'Jane Smith',
    role: 'Lead Teacher',
    email: 'jane@school.com',
    phone: '(555) 123-4567',
    hire_date: '2024-01-15',
    employment_type: 'Full-time',
    hourly_rate: 1800, // cents
    classroom: 'Butterfly Room',
  }

  const certs = [
    { name: 'CPR', expiry: '2026-08-15' },
    { name: 'First Aid', expiry: '2026-04-20' },
    { name: 'ECE Credential', expiry: null },
  ]

  const schedule = [
    { id: '1', day_of_week: 'monday', start_time: '07:30', end_time: '16:00', classroom_name: 'Butterfly Room' },
    { id: '2', day_of_week: 'tuesday', start_time: '07:30', end_time: '16:00', classroom_name: 'Butterfly Room' },
    { id: '3', day_of_week: 'wednesday', start_time: '07:30', end_time: '16:00', classroom_name: 'Butterfly Room' },
    { id: '4', day_of_week: 'thursday', start_time: '07:30', end_time: '16:00', classroom_name: 'Butterfly Room' },
    { id: '5', day_of_week: 'friday', start_time: '07:30', end_time: '14:00', classroom_name: 'Butterfly Room' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <a
          href="/portal/admin/staff"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to staff
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{staff.name}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {staff.role} &mdash; {staff.classroom}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Profile */}
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Email</span>
              <span className="text-[var(--color-foreground)]">{staff.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Phone</span>
              <span className="text-[var(--color-foreground)]">{staff.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Hire Date</span>
              <span className="text-[var(--color-foreground)]">{staff.hire_date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Type</span>
              <span className="text-[var(--color-foreground)]">{staff.employment_type}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Hourly Rate</span>
              <span className="text-[var(--color-foreground)]">${(staff.hourly_rate / 100).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              {certs.map((cert) => (
                <CertStatusBadge
                  key={cert.name}
                  certName={cert.name}
                  expiryDate={cert.expiry}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <ScheduleGrid entries={schedule} />
        </CardContent>
      </Card>
    </div>
  )
}
