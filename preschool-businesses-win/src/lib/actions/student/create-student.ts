'use server'

// @anchor: cca.student.create-action
// Server action: create a student with optional medical profile.
// Validates with Zod, inserts into Supabase, writes audit log.

import { CreateStudentSchema, type CreateStudentInput } from '@/lib/schemas/student'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type CreateStudentResult = {
  ok: boolean
  studentId?: string
  error?: string
  fieldErrors?: Record<string, string>
}

export async function createStudent(input: CreateStudentInput): Promise<CreateStudentResult> {
  // 1. Validate
  const parsed = CreateStudentSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // 2. Insert student
  const { data: student, error: studentErr } = await supabase
    .from('students')
    .insert({
      tenant_id: tenantId,
      first_name: data.first_name,
      last_name: data.last_name,
      preferred_name: data.preferred_name || null,
      date_of_birth: data.date_of_birth,
      gender: data.gender || null,
      enrollment_status: data.enrollment_status,
      enrollment_date: data.enrollment_date || null,
      photo_path: data.photo_path || null,
      notes_internal: data.notes_internal || null,
      created_by: actorId,
      updated_by: actorId,
    })
    .select('id')
    .single()

  if (studentErr || !student) {
    return { ok: false, error: studentErr?.message || 'Failed to create student' }
  }

  // 3. Create medical profile
  const hasMedical =
    data.blood_type ||
    data.primary_physician_name ||
    data.insurance_provider ||
    data.special_needs_notes
  if (hasMedical) {
    await supabase.from('student_medical_profiles').insert({
      tenant_id: tenantId,
      student_id: student.id,
      blood_type: data.blood_type || null,
      primary_physician_name: data.primary_physician_name || null,
      primary_physician_phone: data.primary_physician_phone || null,
      insurance_provider: data.insurance_provider || null,
      insurance_policy_number: data.insurance_policy_number || null,
      special_needs_notes: data.special_needs_notes || null,
      emergency_action_plan_path: data.emergency_action_plan_path || null,
    })
  }

  // 4. Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'student',
    entity_id: student.id,
    after: data as unknown as Record<string, unknown>,
  })

  return { ok: true, studentId: student.id }
}
