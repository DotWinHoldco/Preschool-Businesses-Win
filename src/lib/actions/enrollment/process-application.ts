// @anchor: cca.enrollment.process-application
'use server'

import { ProcessApplicationSchema, type ProcessApplicationInput } from '@/lib/schemas/lead'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { emitEvent } from '@/lib/crm/events'
import { createAdminClient } from '@/lib/supabase/admin'

export type ProcessApplicationState = {
  ok: boolean
  error?: string
  student_id?: string
  family_id?: string
}

export async function processApplication(
  input: ProcessApplicationInput,
): Promise<ProcessApplicationState> {
  await assertRole('admin')

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
    .eq('tenant_id', tenantId)
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
    .eq('tenant_id', tenantId)

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
    before_data: { status: application.triage_status },
    after_data: { status: newStatus, notes: data.notes },
  })

  // Resolve the contact id by email so automations can fire on the application owner.
  let contactId: string | null = null
  if (application.parent_email) {
    const admin = createAdminClient()
    const { data: rpcRes } = await admin.rpc('ensure_contact_for_email', {
      p_tenant_id: tenantId,
      p_email: application.parent_email as string,
      p_first_name: (application.parent_first_name as string | null) ?? null,
      p_last_name: (application.parent_last_name as string | null) ?? null,
      p_phone: (application.parent_phone as string | null) ?? null,
      p_source: 'enrollment_form',
      p_source_detail: null,
    })
    contactId = (rpcRes as string | null) ?? null
  }

  if (data.action === 'approve') {
    await emitEvent({
      tenantId,
      contactId,
      kind: 'application.approved',
      payload: {
        application_id: data.application_id,
        student_id: studentId,
        family_id: familyId,
      },
      source: 'admin_console',
    })
    await emitEvent({
      tenantId,
      contactId,
      kind: 'enrollment.completed',
      payload: { application_id: data.application_id, student_id: studentId },
      source: 'admin_console',
    })
  } else if (data.action === 'reject') {
    await emitEvent({
      tenantId,
      contactId,
      kind: 'application.declined',
      payload: { application_id: data.application_id },
      source: 'admin_console',
    })
  } else if (data.action === 'waitlist') {
    await emitEvent({
      tenantId,
      contactId,
      kind: 'waitlist.added',
      payload: { application_id: data.application_id },
      source: 'admin_console',
    })
  }

  return { ok: true, student_id: studentId, family_id: familyId }
}
