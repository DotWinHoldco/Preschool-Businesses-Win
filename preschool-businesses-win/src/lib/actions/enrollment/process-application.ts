// @anchor: cca.enrollment.process-application
'use server'

import { ProcessApplicationSchema, type ProcessApplicationInput } from '@/lib/schemas/lead'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type ProcessApplicationState = {
  ok: boolean
  error?: string
  student_id?: string
  family_id?: string
}

export async function processApplication(
  input: ProcessApplicationInput
): Promise<ProcessApplicationState> {
  const parsed = ProcessApplicationSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch the application
  const { data: application, error: appError } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', data.application_id)
    .single()

  if (appError || !application) {
    return { ok: false, error: 'Application not found' }
  }

  const statusMap: Record<string, string> = {
    approve: 'approved',
    reject: 'rejected',
    waitlist: 'waitlisted',
    request_info: 'reviewing',
  }

  const newStatus = statusMap[data.action]

  // Update application status
  const updateFields: Record<string, unknown> = {
    triage_status: newStatus,
    triage_notes: data.notes ?? application.triage_notes,
    updated_at: new Date().toISOString(),
  }

  if (data.action === 'approve') {
    updateFields.approved_at = new Date().toISOString()
    updateFields.approved_by = actorId
  }

  const { error: updateError } = await supabase
    .from('enrollment_applications')
    .update(updateFields)
    .eq('id', data.application_id)

  if (updateError) {
    return { ok: false, error: updateError.message }
  }

  let studentId: string | undefined
  let familyId: string | undefined

  // On approve: create family + student records
  if (data.action === 'approve') {
    // Create family
    const { data: family, error: familyError } = await supabase
      .from('families')
      .insert({
        tenant_id: tenantId,
        family_name: `${application.parent_last_name} Family`,
        billing_email: application.parent_email,
        billing_phone: application.parent_phone,
        created_by: actorId,
      })
      .select('id')
      .single()

    if (familyError || !family) {
      return { ok: false, error: familyError?.message ?? 'Failed to create family' }
    }
    familyId = family.id

    // Create student
    const { data: student, error: studentError } = await supabase
      .from('students')
      .insert({
        tenant_id: tenantId,
        first_name: application.student_first_name,
        last_name: application.student_last_name,
        date_of_birth: application.student_dob,
        enrollment_status: 'enrolled',
        enrollment_date: new Date().toISOString().split('T')[0],
        created_by: actorId,
      })
      .select('id')
      .single()

    if (studentError || !student) {
      return { ok: false, error: studentError?.message ?? 'Failed to create student' }
    }
    studentId = student.id

    // Link student to family
    await supabase.from('student_family_links').insert({
      tenant_id: tenantId,
      student_id: student.id,
      family_id: family.id,
      is_primary_family: true,
      billing_split_pct: 100,
    })

    // Update application with converted IDs
    await supabase
      .from('enrollment_applications')
      .update({
        converted_to_student_id: student.id,
        converted_to_family_id: family.id,
        converted_at: new Date().toISOString(),
      })
      .eq('id', data.application_id)

    // TODO: Send magic-link onboarding email via Resend
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: `enrollment.application.${data.action}`,
    entity_type: 'enrollment_application',
    entity_id: data.application_id,
    before: { status: application.triage_status },
    after: { status: newStatus, notes: data.notes },
  })

  return { ok: true, student_id: studentId, family_id: familyId }
}
