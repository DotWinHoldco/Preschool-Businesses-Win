// @anchor: cca.appointments.admin-types

import { createTenantServerClient } from '@/lib/supabase/server'
import { Settings } from 'lucide-react'

export default async function AppointmentTypesSettingsPage() {
  const supabase = await createTenantServerClient()

  const { data: types } = await supabase
    .from('appointment_types')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Settings className="h-5 w-5 text-[var(--color-primary)]" />
            <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Appointment Types</h1>
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Configure the types of appointments parents and applicants can book
          </p>
        </div>
      </div>

      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)]">
        {types && types.length > 0 ? (
          <ul className="divide-y divide-[var(--color-border)]">
            {types.map((t: Record<string, unknown>) => (
              <li key={t.id as string} className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-foreground)]">
                      {t.name as string}
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      {t.duration_minutes as number} min · {t.location_type as string} ·{' '}
                      {t.location as string | null} · Booking window:{' '}
                      {t.booking_window_days as number}d · Min notice:{' '}
                      {t.min_notice_hours as number}h · Max/day:{' '}
                      {(t.max_per_day as number | null) ?? '∞'}
                    </div>
                  </div>
                  <span className="rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-xs">
                    /{t.slug as string}
                  </span>
                </div>
                {t.description ? (
                  <p className="mt-2 text-sm text-[var(--color-foreground)]/80">
                    {t.description as string}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-8 text-center text-sm text-[var(--color-muted-foreground)]">
            No appointment types configured. The platform seeds &ldquo;School Tour &amp;
            Interview&rdquo; for CCA.
          </div>
        )}
      </div>
    </div>
  )
}
