// @anchor: cca.appointments.booking-page
// Standalone appointment booking widget — tenant-branded, outside portal chrome.

import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { BookingWidget } from '@/components/appointments/booking-widget'

interface PageProps {
  params: Promise<{ tenantSlug: string; appointmentTypeSlug: string }>
  searchParams: Promise<{ token?: string; application_id?: string; name?: string; email?: string }>
}

export default async function BookingPage({ params, searchParams }: PageProps) {
  const { tenantSlug, appointmentTypeSlug } = await params
  const query = await searchParams
  const supabase = createAdminClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, slug, name')
    .eq('slug', tenantSlug)
    .single()

  if (!tenant) notFound()

  const { data: apptType } = await supabase
    .from('appointment_types')
    .select('*')
    .eq('tenant_id', tenant.id)
    .eq('slug', appointmentTypeSlug)
    .eq('is_active', true)
    .single()

  if (!apptType) notFound()

  const { data: branding } = await supabase
    .from('tenant_branding')
    .select('school_name, logo_path, logo_icon_path')
    .eq('tenant_id', tenant.id)
    .maybeSingle()

  let prefillName = query.name ?? ''
  let prefillEmail = query.email ?? ''
  let prefillPhone = ''
  const applicationId = query.application_id

  if (applicationId) {
    const { data: app } = await supabase
      .from('enrollment_applications')
      .select('parent_first_name, parent_last_name, parent_email, parent_phone')
      .eq('id', applicationId)
      .eq('tenant_id', tenant.id)
      .maybeSingle()
    if (app) {
      prefillName = `${app.parent_first_name} ${app.parent_last_name}`
      prefillEmail = app.parent_email ?? prefillEmail
      prefillPhone = app.parent_phone ?? ''
    }
  }

  return (
    <main className="min-h-screen bg-[var(--color-background)]">
      <BookingWidget
        tenantSlug={tenantSlug}
        appointmentType={{
          id: apptType.id,
          name: apptType.name,
          description: apptType.description,
          duration_minutes: apptType.duration_minutes,
          location: apptType.location,
          location_type: apptType.location_type,
        }}
        branding={branding ?? null}
        prefill={{
          name: prefillName,
          email: prefillEmail,
          phone: prefillPhone,
          application_id: applicationId,
        }}
      />
    </main>
  )
}
