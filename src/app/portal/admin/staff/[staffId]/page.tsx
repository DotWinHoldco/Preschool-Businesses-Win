// @anchor: cca.staff.admin-detail
// Staff detail page — profile, certs, schedule, time entries — real Supabase data.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { CertStatusBadge } from '@/components/portal/staff/cert-status-badge'
import { ScheduleGrid } from '@/components/portal/staff/schedule-grid'

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ staffId: string }>
}) {
  const { staffId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  // Fetch staff profile
  const { data: staffRow } = await supabase
    .from('staff_profiles')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', staffId)
    .single()

  if (!staffRow) notFound()

  // Fetch related data in parallel
  const [{ data: userProfile }, { data: certs }, { data: schedules }, { data: timeEntries }] =
    await Promise.all([
      staffRow.user_id
        ? supabase.from('user_profiles').select('*').eq('id', staffRow.user_id).single()
        : Promise.resolve({ data: null }),
      supabase
        .from('staff_certifications')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId),
      supabase
        .from('staff_schedules')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId)
        .order('day_of_week', { ascending: true }),
      supabase
        .from('time_entries')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('staff_id', staffId)
        .order('clock_in', { ascending: false })
        .limit(10),
    ])

  const staffName = userProfile
    ? `${userProfile.first_name ?? ''} ${userProfile.last_name ?? ''}`.trim()
    : 'Unknown'
  const staffEmail = userProfile?.email ?? '-'
  const staffPhone = userProfile?.phone ?? '-'

  const certList = (certs ?? []).map((c) => ({
    name: c.cert_name as string,
    expiry: c.expiry_date as string | null,
  }))

  const scheduleEntries = (schedules ?? []).map((s) => ({
    id: s.id as string,
    day_of_week: s.day_of_week as string,
    start_time: s.start_time as string,
    end_time: s.end_time as string,
    classroom_name: (s.classroom_name as string) ?? '',
  }))

  return (
    <div className="flex flex-col gap-6">
      <div>
        <a
          href="/portal/admin/staff"
          className="text-sm text-[var(--color-primary)] hover:underline mb-2 inline-block"
        >
          &larr; Back to staff
        </a>
        <h1 className="text-2xl font-bold text-[var(--color-foreground)]">{staffName}</h1>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {staffRow.employment_type ?? 'Staff'}
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
              <span className="text-[var(--color-foreground)]">{staffEmail}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Phone</span>
              <span className="text-[var(--color-foreground)]">{staffPhone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Hire Date</span>
              <span className="text-[var(--color-foreground)]">{staffRow.hire_date ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Type</span>
              <span className="text-[var(--color-foreground)]">{staffRow.employment_type ?? '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--color-muted-foreground)]">Hourly Rate</span>
              <span className="text-[var(--color-foreground)]">
                {staffRow.hourly_rate ? `$${(staffRow.hourly_rate / 100).toFixed(2)}` : '-'}
              </span>
            </div>
            {staffRow.bio && (
              <div className="flex justify-between">
                <span className="text-[var(--color-muted-foreground)]">Bio</span>
                <span className="text-[var(--color-foreground)] text-right max-w-[60%]">{staffRow.bio}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Certifications */}
        <Card>
          <CardHeader>
            <CardTitle>Certifications</CardTitle>
          </CardHeader>
          <CardContent>
            {certList.length === 0 ? (
              <p className="text-sm text-[var(--color-muted-foreground)]">No certifications on file.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {certList.map((cert) => (
                  <CertStatusBadge
                    key={cert.name}
                    certName={cert.name}
                    expiryDate={cert.expiry}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          {scheduleEntries.length === 0 ? (
            <p className="text-sm text-[var(--color-muted-foreground)]">No schedule entries.</p>
          ) : (
            <ScheduleGrid entries={scheduleEntries} />
          )}
        </CardContent>
      </Card>

      {/* Recent Time Entries */}
      {(timeEntries ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Time Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(timeEntries ?? []).map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] p-3 text-sm"
                >
                  <span className="text-[var(--color-foreground)]">
                    {entry.clock_in
                      ? new Date(entry.clock_in as string).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })
                      : '-'}
                  </span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {entry.clock_in
                      ? new Date(entry.clock_in as string).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : ''}{' '}
                    &mdash;{' '}
                    {entry.clock_out
                      ? new Date(entry.clock_out as string).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })
                      : 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
