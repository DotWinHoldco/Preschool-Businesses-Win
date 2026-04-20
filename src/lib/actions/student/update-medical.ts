'use server'

// @anchor: cca.student.update-medical-action
// Server action: update student medical profile notes / physician / insurance.
// Validates with Zod, upserts into student_medical_profiles, writes audit log.

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

const UpdateMedicalSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  blood_type: z.string().max(10).nullable().optional(),
  primary_physician_name: z.string().max(200).nullable().optional(),
  primary_physician_phone: z.string().max(30).nullable().optional(),
  insurance_provider: z.string().max(200).nullable().optional(),
  insurance_policy_number: z.string().max(100).nullable().optional(),
  special_needs_notes: z.string().max(5000).nullable().optional(),
})

export type UpdateMedicalInput = z.infer<typeof UpdateMedicalSchema>
export type UpdateMedicalResult = { ok: true } | { ok: false; error: string }

export async function updateMedical(
  input: UpdateMedicalInput,
): Promise<UpdateMedicalResult> {
  await assertRole('admin')

  const parsed = UpdateMedicalSchema.safeParse(input)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join(', ')
    return { ok: false, error: msg }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Check student exists
  const { data: student } = await supabase
    .from('students')
    .select('id')
    .eq('id', data.student_id)
    .eq('tenant_id', tenantId)
    .single()

  if (!student) {
    return { ok: false, error: 'Student not found' }
  }

  const { student_id: _sid, ...medicalFields } = data

  // Upsert medical profile
  const { data: existing } = await supabase
    .from('student_medical_profiles')
    .select('*')
    .eq('student_id', data.student_id)
    .eq('tenant_id', tenantId)
    .single()

  if (existing) {
    const { error } = await supabase
      .from('student_medical_profiles')
      .update(medicalFields)
      .eq('student_id', data.student_id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }
  } else {
    const { error } = await supabase
      .from('student_medical_profiles')
      .insert({
        tenant_id: tenantId,
        student_id: data.student_id,
        ...medicalFields,
      })

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  // Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'student_medical_profile',
    entity_id: data.student_id,
    before_data: existing as unknown as Record<string, unknown> ?? null,
    after_data: data as unknown as Record<string, unknown>,
  })

  revalidatePath(`/portal/admin/students/${data.student_id}`)
  return { ok: true }
}
