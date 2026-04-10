'use server'

// @anchor: cca.dropin.manage-availability
// Set drop-in availability per classroom per date
// See CCA_BUILD_BRIEF.md §31

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { ManageDropInAvailabilitySchema, type ManageDropInAvailabilityInput } from '@/lib/schemas/drop-in'

export async function setDropInAvailability(input: ManageDropInAvailabilityInput) {
  const parsed = ManageDropInAvailabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  // Upsert availability for this classroom + date
  const { data, error } = await supabase
    .from('drop_in_availability')
    .upsert(
      {
        tenant_id: tenantId,
        classroom_id: parsed.data.classroom_id,
        date: parsed.data.date,
        slots_total: parsed.data.slots_total,
        rate_cents: parsed.data.rate_cents,
        half_day_rate_cents: parsed.data.half_day_rate_cents ?? null,
        status: parsed.data.status,
      },
      { onConflict: 'tenant_id,classroom_id,date' },
    )
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, availabilityId: data.id as string }
}

export async function bulkSetAvailability(
  classroomId: string,
  dateRange: { start: string; end: string },
  slotCount: number,
  rateCents: number,
  halfDayRateCents?: number,
) {
  const tenantId = await getTenantId()
  const supabase = createAdminClient()

  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)
  const rows: Array<Record<string, unknown>> = []

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue

    rows.push({
      tenant_id: tenantId,
      classroom_id: classroomId,
      date: d.toISOString().split('T')[0],
      slots_total: slotCount,
      rate_cents: rateCents,
      half_day_rate_cents: halfDayRateCents ?? null,
      status: 'open',
    })
  }

  if (rows.length === 0) {
    return { ok: true as const, count: 0 }
  }

  const { error } = await supabase
    .from('drop_in_availability')
    .upsert(rows, { onConflict: 'tenant_id,classroom_id,date' })

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  return { ok: true as const, count: rows.length }
}
