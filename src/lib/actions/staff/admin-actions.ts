'use server'

// @anchor: cca.staff.admin-actions
// Admin-side create/update/delete for staff profile, certifications, schedule, PTO.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type StaffActionResult = { ok: boolean; id?: string; error?: string }

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const StaffProfilePatchSchema = z.object({
  employment_type: z.enum(['full_time', 'part_time', 'substitute']).optional(),
  hourly_rate: z.number().int().min(0).max(1_000_000).optional().nullable(),
  bio: z.string().max(5000).optional().nullable(),
})

export async function saveStaffProfile(
  staffId: string,
  patch: z.infer<typeof StaffProfilePatchSchema>,
): Promise<StaffActionResult> {
  await assertRole('admin')
  const idParsed = z.string().uuid().safeParse(staffId)
  if (!idParsed.success) return { ok: false, error: 'Invalid staff id' }
  const parsed = StaffProfilePatchSchema.safeParse(patch)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('staff_profiles')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', idParsed.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.profile.update',
    entityType: 'staff_profile',
    entityId: idParsed.data,
    after: parsed.data,
  })

  revalidatePath(`/portal/admin/staff/${idParsed.data}`)
  return { ok: true, id: idParsed.data }
}

// ---------------------------------------------------------------------------
// Certifications
// ---------------------------------------------------------------------------

const CertSchema = z.object({
  certification_name: z.string().min(1).max(200),
  issuing_organization: z.string().min(1).max(200).optional().nullable(),
  issued_date: z.string().min(1).max(20).optional().nullable(),
  expiry_date: z.string().min(1).max(20).optional().nullable(),
  certificate_url: z.string().url().max(1000).optional().nullable().or(z.literal('')),
})

export async function addStaffCertification(
  staffId: string,
  input: z.infer<typeof CertSchema>,
): Promise<StaffActionResult> {
  await assertRole('admin')
  const idParsed = z.string().uuid().safeParse(staffId)
  if (!idParsed.success) return { ok: false, error: 'Invalid staff id' }
  const parsed = CertSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Match existing schema column names (cert_name, issuing_body, document_path).
  const { data, error } = await supabase
    .from('staff_certifications')
    .insert({
      tenant_id: tenantId,
      staff_id: idParsed.data,
      cert_name: parsed.data.certification_name,
      issuing_body: parsed.data.issuing_organization ?? null,
      issued_date: parsed.data.issued_date ?? null,
      expiry_date: parsed.data.expiry_date ?? null,
      document_path: parsed.data.certificate_url || null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed to add certification' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.certification.add',
    entityType: 'staff_certification',
    entityId: data.id as string,
    after: parsed.data,
  })

  revalidatePath(`/portal/admin/staff/${idParsed.data}`)
  return { ok: true, id: data.id as string }
}

export async function updateStaffCertification(
  id: string,
  patch: Partial<z.infer<typeof CertSchema>>,
): Promise<StaffActionResult> {
  await assertRole('admin')
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const update: Record<string, unknown> = {}
  if (patch.certification_name !== undefined) update.cert_name = patch.certification_name
  if (patch.issuing_organization !== undefined) update.issuing_body = patch.issuing_organization
  if (patch.issued_date !== undefined) update.issued_date = patch.issued_date
  if (patch.expiry_date !== undefined) update.expiry_date = patch.expiry_date
  if (patch.certificate_url !== undefined) update.document_path = patch.certificate_url || null

  const { error } = await supabase
    .from('staff_certifications')
    .update(update)
    .eq('id', idParsed.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.certification.update',
    entityType: 'staff_certification',
    entityId: idParsed.data,
    after: patch,
  })

  return { ok: true, id: idParsed.data }
}

export async function deleteStaffCertification(id: string): Promise<StaffActionResult> {
  await assertRole('admin')
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('staff_certifications')
    .delete()
    .eq('id', idParsed.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.certification.delete',
    entityType: 'staff_certification',
    entityId: idParsed.data,
  })

  return { ok: true, id: idParsed.data }
}

// ---------------------------------------------------------------------------
// Schedule (per-day upsert)
// ---------------------------------------------------------------------------

const ScheduleDayEnum = z.enum([
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
])

const UpsertScheduleSchema = z.object({
  day_of_week: ScheduleDayEnum,
  start_time: z.string().min(1).max(20),
  end_time: z.string().min(1).max(20),
  is_working_day: z.boolean().default(true),
})

export async function upsertStaffSchedule(
  staffId: string,
  day_of_week: z.infer<typeof ScheduleDayEnum>,
  start_time: string,
  end_time: string,
  is_working_day: boolean,
): Promise<StaffActionResult> {
  await assertRole('admin')
  const idParsed = z.string().uuid().safeParse(staffId)
  if (!idParsed.success) return { ok: false, error: 'Invalid staff id' }
  const parsed = UpsertScheduleSchema.safeParse({
    day_of_week,
    start_time,
    end_time,
    is_working_day,
  })
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Look for an existing row for this staff + day.
  const { data: existing } = await supabase
    .from('staff_schedules')
    .select('id')
    .eq('tenant_id', tenantId)
    .eq('staff_id', idParsed.data)
    .eq('day_of_week', parsed.data.day_of_week)
    .is('effective_to', null)
    .maybeSingle()

  const row = {
    day_of_week: parsed.data.day_of_week,
    start_time: parsed.data.start_time,
    end_time: parsed.data.end_time,
    is_working_day: parsed.data.is_working_day,
  }

  if (existing?.id) {
    const { error } = await supabase.from('staff_schedules').update(row).eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('staff_schedules').insert({
      tenant_id: tenantId,
      staff_id: idParsed.data,
      effective_from: new Date().toISOString().slice(0, 10),
      ...row,
    })
    if (error) return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.schedule.upsert',
    entityType: 'staff_schedule',
    entityId: idParsed.data,
    after: row,
  })

  revalidatePath(`/portal/admin/staff/${idParsed.data}`)
  return { ok: true, id: idParsed.data }
}

// ---------------------------------------------------------------------------
// PTO balances
// ---------------------------------------------------------------------------

const PtoBalanceSchema = z.object({
  user_id: z.string().uuid(),
  policy_name: z.string().min(1).max(200),
  accrued_hours: z.number().min(0),
  used_hours: z.number().min(0).default(0),
  pending_hours: z.number().min(0).default(0),
  year: z.number().int().min(2000).max(3000),
})

export async function addPtoBalance(
  input: z.infer<typeof PtoBalanceSchema>,
): Promise<StaffActionResult> {
  await assertRole('director')
  const parsed = PtoBalanceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data, error } = await supabase
    .from('pto_balances')
    .insert({ tenant_id: tenantId, ...parsed.data })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.pto.add',
    entityType: 'pto_balance',
    entityId: data.id as string,
    after: parsed.data,
  })

  revalidatePath(`/portal/admin/staff`)
  return { ok: true, id: data.id as string }
}

export async function updatePtoBalance(
  id: string,
  patch: Partial<z.infer<typeof PtoBalanceSchema>>,
): Promise<StaffActionResult> {
  await assertRole('director')
  const idParsed = z.string().uuid().safeParse(id)
  if (!idParsed.success) return { ok: false, error: 'Invalid id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { error } = await supabase
    .from('pto_balances')
    .update({ ...patch, updated_at: new Date().toISOString() })
    .eq('id', idParsed.data)
    .eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'staff.pto.update',
    entityType: 'pto_balance',
    entityId: idParsed.data,
    after: patch,
  })

  return { ok: true, id: idParsed.data }
}
