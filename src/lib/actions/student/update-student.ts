'use server'

// @anchor: cca.student.update-action
// Server action: update student record and/or medical profile.
// Validates with Zod, updates Supabase, writes audit log with before/after.

import { UpdateStudentSchema, type UpdateStudentInput } from '@/lib/schemas/student'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

export type UpdateStudentResult = {
  ok: boolean
  error?: string
  fieldErrors?: Record<string, string>
}

export async function updateStudent(input: UpdateStudentInput): Promise<UpdateStudentResult> {
  await assertRole('admin')

  // 1. Validate
  const parsed = UpdateStudentSchema.safeParse(input)
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

  // 2. Fetch current state for audit log
  const { data: before } = await supabase
    .from('students')
    .select('*')
    .eq('id', data.id)
    .eq('tenant_id', tenantId)
    .single()

  if (!before) {
    return { ok: false, error: 'Student not found' }
  }

  // 3. Split student fields from medical fields
  const medicalKeys = [
    'blood_type',
    'primary_physician_name',
    'primary_physician_phone',
    'insurance_provider',
    'insurance_policy_number',
    'special_needs_notes',
    'emergency_action_plan_path',
  ] as const

  const studentUpdates: Record<string, unknown> = {}
  const medicalUpdates: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(data)) {
    if (key === 'id') continue
    if (medicalKeys.includes(key as (typeof medicalKeys)[number])) {
      medicalUpdates[key] = value
    } else {
      studentUpdates[key] = value
    }
  }

  // 4. Update student record
  if (Object.keys(studentUpdates).length > 0) {
    studentUpdates.updated_by = actorId
    const { error } = await supabase
      .from('students')
      .update(studentUpdates)
      .eq('id', data.id)
      .eq('tenant_id', tenantId)

    if (error) {
      return { ok: false, error: error.message }
    }
  }

  // 5. Update or insert medical profile
  if (Object.keys(medicalUpdates).length > 0) {
    const { data: existing } = await supabase
      .from('student_medical_profiles')
      .select('id')
      .eq('student_id', data.id)
      .eq('tenant_id', tenantId)
      .single()

    if (existing) {
      await supabase
        .from('student_medical_profiles')
        .update(medicalUpdates)
        .eq('student_id', data.id)
        .eq('tenant_id', tenantId)
    } else {
      await supabase.from('student_medical_profiles').insert({
        tenant_id: tenantId,
        student_id: data.id,
        ...medicalUpdates,
      })
    }
  }

  // 6. Audit log
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'update',
    entity_type: 'student',
    entity_id: data.id,
    before_data: before as unknown as Record<string, unknown>,
    after_data: data as unknown as Record<string, unknown>,
  })

  return { ok: true }
}
