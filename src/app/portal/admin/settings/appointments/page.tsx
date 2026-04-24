// @anchor: cca.appointments.admin-types

import { headers } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { Settings } from 'lucide-react'
import { AppointmentTypesClient } from '@/components/portal/appointments/appointment-types-client'

export default async function AppointmentTypesSettingsPage() {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const headerStore = await headers()
  const tenantSlug = headerStore.get('x-tenant-slug') ?? ''

  const supabase = createAdminClient()

  // Fetch all appointment types (active + inactive) with all fields
  const { data: types } = await supabase
    .from('appointment_types')
    .select(
      'id, name, slug, description, duration_minutes, buffer_before_minutes, buffer_after_minutes, color, location, location_type, virtual_meeting_url, booking_window_days, min_notice_hours, max_per_day, max_per_slot, assigned_staff, round_robin, require_confirmation, auto_confirm, confirmation_message, reminder_hours, linked_pipeline_stage, is_active',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  // Fetch active staff for multi-staff picker
  const { data: staffRows } = await supabase
    .from('staff')
    .select('id, user_id, first_name, last_name, role')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  const appointmentTypes = (types ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    slug: t.slug as string,
    description: (t.description as string | null) ?? null,
    duration_minutes: t.duration_minutes as number,
    buffer_before_minutes: (t.buffer_before_minutes as number) ?? 0,
    buffer_after_minutes: (t.buffer_after_minutes as number) ?? 15,
    color: (t.color as string | null) ?? null,
    location: (t.location as string | null) ?? null,
    location_type: (t.location_type as string) ?? 'in_person',
    virtual_meeting_url: (t.virtual_meeting_url as string | null) ?? null,
    booking_window_days: (t.booking_window_days as number) ?? 30,
    min_notice_hours: (t.min_notice_hours as number) ?? 24,
    max_per_day: (t.max_per_day as number | null) ?? null,
    max_per_slot: (t.max_per_slot as number) ?? 1,
    assigned_staff: (t.assigned_staff as string[]) ?? [],
    round_robin: (t.round_robin as boolean) ?? false,
    require_confirmation: (t.require_confirmation as boolean) ?? false,
    auto_confirm: (t.auto_confirm as boolean) ?? true,
    confirmation_message: (t.confirmation_message as string | null) ?? null,
    reminder_hours: (t.reminder_hours as number[]) ?? [24, 1],
    linked_pipeline_stage: (t.linked_pipeline_stage as string | null) ?? null,
    price_cents: ((t as Record<string, unknown>).price_cents as number | null) ?? null,
    is_active: (t.is_active as boolean) ?? true,
  }))

  const staff = (staffRows ?? []).map((s) => ({
    id: s.id as string,
    user_id: s.user_id as string,
    first_name: (s.first_name as string) ?? '',
    last_name: (s.last_name as string) ?? '',
    role: (s.role as string) ?? '',
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Settings className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Appointment Types</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)] ml-7">
          Configure the types of appointments parents and applicants can book
        </p>
      </div>

      <AppointmentTypesClient
        appointmentTypes={appointmentTypes}
        staff={staff}
        tenantSlug={tenantSlug}
      />
    </div>
  )
}
