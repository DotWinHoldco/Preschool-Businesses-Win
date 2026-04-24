// @anchor: cca.appointments.admin-dashboard

import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'
import { AppointmentsDashboardClient } from '@/components/portal/appointments/appointments-dashboard-client'

export default async function AppointmentsDashboardPage() {
  const session = await getSession()
  if (!session) redirect('/portal/login')

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) redirect('/portal/login')

  const supabase = createAdminClient()

  const now = new Date().toISOString()
  const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
  const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString()
  const todayEnd = new Date(new Date().setHours(23, 59, 59, 999)).toISOString()

  const [
    appointmentsRes,
    typesRes,
    staffRes,
    todayRes,
    pendingRes,
    weekRes,
    completedRes,
    totalRes,
  ] = await Promise.all([
    supabase
      .from('appointments')
      .select(
        'id, appointment_type_id, booked_by_name, booked_by_email, booked_by_phone, start_at, end_at, timezone, staff_user_id, status, notes, staff_notes, cancellation_reason, enrollment_application_id, confirmation_token, rescheduled_from_id, created_at, appointment_types(name, color, slug, duration_minutes)',
      )
      .eq('tenant_id', tenantId)
      .order('start_at', { ascending: false })
      .limit(100),
    supabase
      .from('appointment_types')
      .select('id, name, color, slug')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('staff')
      .select('id, user_id, first_name, last_name, role')
      .eq('tenant_id', tenantId)
      .eq('status', 'active')
      .order('first_name'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_at', todayStart)
      .lte('start_at', todayEnd)
      .not('status', 'in', '("cancelled_by_parent","cancelled_by_staff","rescheduled")'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'pending'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('start_at', now)
      .lte('start_at', weekFromNow)
      .not('status', 'in', '("cancelled_by_parent","cancelled_by_staff","rescheduled")'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .eq('status', 'completed'),
    supabase
      .from('appointments')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .not('status', 'in', '("rescheduled")'),
  ])

  const appointments = (appointmentsRes.data ?? []).map((row) => {
    const apptType = row.appointment_types as unknown as {
      name: string
      color: string | null
      slug: string
      duration_minutes: number
    } | null
    return {
      id: row.id as string,
      appointment_type_id: row.appointment_type_id as string,
      type_name: apptType?.name ?? 'Unknown',
      type_color: apptType?.color ?? null,
      type_slug: apptType?.slug ?? '',
      duration_minutes: apptType?.duration_minutes ?? 30,
      booked_by_name: row.booked_by_name as string,
      booked_by_email: row.booked_by_email as string,
      booked_by_phone: (row.booked_by_phone as string) ?? null,
      start_at: row.start_at as string,
      end_at: row.end_at as string,
      timezone: row.timezone as string,
      staff_user_id: (row.staff_user_id as string) ?? null,
      status: row.status as string,
      notes: (row.notes as string) ?? null,
      staff_notes: (row.staff_notes as string) ?? null,
      cancellation_reason: (row.cancellation_reason as string) ?? null,
      enrollment_application_id: (row.enrollment_application_id as string) ?? null,
      price_cents: ((row as Record<string, unknown>).price_cents as number) ?? null,
      confirmation_token: (row.confirmation_token as string) ?? null,
      rescheduled_from_id: (row.rescheduled_from_id as string) ?? null,
      created_at: row.created_at as string,
    }
  })

  const staffMap: Record<string, string> = {}
  for (const s of staffRes.data ?? []) {
    staffMap[s.user_id as string] = `${s.first_name} ${s.last_name}`
  }

  const types = (typesRes.data ?? []).map((t) => ({
    id: t.id as string,
    name: t.name as string,
    color: (t.color as string) ?? null,
    slug: (t.slug as string) ?? '',
  }))

  const staff = (staffRes.data ?? []).map((s) => ({
    id: s.id as string,
    user_id: s.user_id as string,
    name: `${s.first_name} ${s.last_name}`,
  }))

  const stats = {
    today: todayRes.count ?? 0,
    pending: pendingRes.count ?? 0,
    thisWeek: weekRes.count ?? 0,
    completionRate:
      (totalRes.count ?? 0) > 0
        ? Math.round(((completedRes.count ?? 0) / (totalRes.count ?? 1)) * 100)
        : 0,
  }

  return (
    <AppointmentsDashboardClient
      appointments={appointments}
      staffMap={staffMap}
      types={types}
      staff={staff}
      stats={stats}
    />
  )
}
