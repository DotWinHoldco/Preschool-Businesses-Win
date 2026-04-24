'use server'

import { ListAppointmentsSchema, type ListAppointmentsInput } from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export interface AppointmentRow {
  id: string
  appointment_type_id: string
  type_name: string
  type_color: string | null
  type_slug: string
  duration_minutes: number
  booked_by_name: string
  booked_by_email: string
  booked_by_phone: string | null
  start_at: string
  end_at: string
  timezone: string
  staff_user_id: string | null
  staff_name: string | null
  status: string
  notes: string | null
  staff_notes: string | null
  cancellation_reason: string | null
  enrollment_application_id: string | null
  price_cents: number | null
  confirmation_token: string | null
  rescheduled_from_id: string | null
  created_at: string
}

export async function listAppointments(
  input: ListAppointmentsInput,
): Promise<{ ok: boolean; items: AppointmentRow[]; total: number; error?: string }> {
  await assertRole('admin')
  const parsed = ListAppointmentsSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      items: [],
      total: 0,
      error: parsed.error.issues[0]?.message ?? 'Validation failed',
    }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()
  const { status, appointment_type_id, staff_user_id, date_from, date_to, search, page, per_page } =
    parsed.data

  let query = supabase
    .from('appointments')
    .select(
      'id, appointment_type_id, booked_by_name, booked_by_email, booked_by_phone, start_at, end_at, timezone, staff_user_id, status, notes, staff_notes, cancellation_reason, enrollment_application_id, confirmation_token, rescheduled_from_id, created_at, appointment_types(name, color, slug, duration_minutes)',
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)

  if (status && status.length > 0) {
    query = query.in('status', status)
  }
  if (appointment_type_id) {
    query = query.eq('appointment_type_id', appointment_type_id)
  }
  if (staff_user_id) {
    query = query.eq('staff_user_id', staff_user_id)
  }
  if (date_from) {
    query = query.gte('start_at', `${date_from}T00:00:00Z`)
  }
  if (date_to) {
    query = query.lte('start_at', `${date_to}T23:59:59Z`)
  }
  if (search) {
    query = query.or(`booked_by_name.ilike.%${search}%,booked_by_email.ilike.%${search}%`)
  }

  const from = (page - 1) * per_page
  const to = from + per_page - 1

  const { data, count, error } = await query.order('start_at', { ascending: false }).range(from, to)

  if (error) return { ok: false, items: [], total: 0, error: error.message }

  const items: AppointmentRow[] = (data ?? []).map((row) => {
    const apptType = row.appointment_types as unknown as Record<string, unknown> | null
    return {
      id: row.id as string,
      appointment_type_id: row.appointment_type_id as string,
      type_name: (apptType?.name as string) ?? 'Unknown',
      type_color: (apptType?.color as string) ?? null,
      type_slug: (apptType?.slug as string) ?? '',
      duration_minutes: (apptType?.duration_minutes as number) ?? 30,
      booked_by_name: row.booked_by_name as string,
      booked_by_email: row.booked_by_email as string,
      booked_by_phone: (row.booked_by_phone as string) ?? null,
      start_at: row.start_at as string,
      end_at: row.end_at as string,
      timezone: row.timezone as string,
      staff_user_id: (row.staff_user_id as string) ?? null,
      staff_name: null,
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

  return { ok: true, items, total: count ?? 0 }
}
