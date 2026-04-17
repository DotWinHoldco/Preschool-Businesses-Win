// @anchor: cca.appointments.admin-dashboard

import { createTenantServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Calendar, Settings, Clock } from 'lucide-react'

export default async function AppointmentsDashboardPage() {
  const supabase = await createTenantServerClient()

  const { data: upcoming } = await supabase
    .from('appointments')
    .select('*, appointment_types(name, duration_minutes)')
    .gte('start_at', new Date().toISOString())
    .order('start_at', { ascending: true })
    .limit(50)

  const { data: types } = await supabase
    .from('appointment_types')
    .select('id, name, slug, duration_minutes, is_active')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Appointments</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Scheduled bookings, appointment types, and staff availability
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/portal/admin/settings/appointments"
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
          >
            <Settings className="h-4 w-4" />
            Types
          </Link>
          <Link
            href="/portal/admin/appointments/availability"
            className="inline-flex items-center gap-1 rounded-[var(--radius)] border border-[var(--color-border)] px-3 py-1.5 text-sm hover:bg-[var(--color-muted)]"
          >
            <Clock className="h-4 w-4" />
            Availability
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Upcoming Bookings
          </h2>
          {upcoming && upcoming.length > 0 ? (
            <ul className="divide-y divide-[var(--color-border)]">
              {upcoming.map((a: Record<string, unknown>) => {
                const typeInfo = a.appointment_types as { name: string; duration_minutes: number } | null
                const start = new Date(a.start_at as string)
                return (
                  <li key={a.id as string} className="flex items-center justify-between py-3">
                    <div>
                      <div className="text-sm font-semibold text-[var(--color-foreground)]">
                        {a.booked_by_name as string}
                      </div>
                      <div className="text-xs text-[var(--color-muted-foreground)]">
                        {typeInfo?.name ?? 'Appointment'} · {start.toLocaleString()}
                      </div>
                    </div>
                    <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs">
                      {a.status as string}
                    </span>
                  </li>
                )
              })}
            </ul>
          ) : (
            <div className="text-sm text-[var(--color-muted-foreground)]">No upcoming appointments.</div>
          )}
        </div>

        <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-6">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--color-muted-foreground)]">
            Appointment Types
          </h2>
          {types && types.length > 0 ? (
            <ul className="space-y-2">
              {types.map((t: Record<string, unknown>) => (
                <li key={t.id as string} className="flex items-center justify-between rounded-[var(--radius)] border border-[var(--color-border)] p-2">
                  <div>
                    <div className="text-sm font-medium text-[var(--color-foreground)]">{t.name as string}</div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {t.duration_minutes as number} min · /{t.slug as string}
                    </div>
                  </div>
                  {(t.is_active as boolean) && (
                    <span className="rounded-full bg-[var(--color-primary)]/15 px-2 py-0.5 text-[10px] text-[var(--color-primary)]">
                      active
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-sm text-[var(--color-muted-foreground)]">No appointment types yet.</div>
          )}
        </div>
      </div>
    </div>
  )
}
