'use server'

// @anchor: cca.dropin.manage-availability
// Set drop-in availability per classroom per date
// See CCA_BUILD_BRIEF.md §31

import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { ManageDropInAvailabilitySchema, type ManageDropInAvailabilityInput } from '@/lib/schemas/drop-in'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

export async function setDropInAvailability(input: ManageDropInAvailabilityInput) {
  await assertRole('admin')

  const parsed = ManageDropInAvailabilitySchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
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

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'drop_in.manage_availability',
    entityType: 'drop_in_availability',
    entityId: data.id as string,
    after: { classroom_id: parsed.data.classroom_id, date: parsed.data.date, slots_total: parsed.data.slots_total, status: parsed.data.status },
  })

  return { ok: true as const, availabilityId: data.id as string }
}

export async function bulkSetAvailability(
  classroomId: string,
  dateRange: { start: string; end: string },
  slotCount: number,
  rateCents: number,
  halfDayRateCents?: number,
) {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const actorId = await getActorId()
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

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'drop_in.manage_availability',
    entityType: 'drop_in_availability',
    entityId: classroomId,
    after: { date_range: dateRange, slots: slotCount, count: rows.length },
  })

  return { ok: true as const, count: rows.length }
}
