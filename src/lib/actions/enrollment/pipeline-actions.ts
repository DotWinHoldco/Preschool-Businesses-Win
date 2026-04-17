'use server'

// @anchor: cca.applications.pipeline.actions
// Pipeline stage transitions for enrollment applications.

import { PipelineActionSchema, type PipelineActionInput } from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

type ActionResult = { ok: boolean; error?: string }

type ActionName = PipelineActionInput['action']

const STAGE_MAP: Record<ActionName, string> = {
  accept_and_invite_interview: 'interview_invited',
  mark_interview_complete: 'interview_completed',
  send_offer: 'offer_sent',
  accept_offer: 'enrolled',
  request_info: 'info_requested',
  waitlist: 'waitlisted',
  reject: 'rejected',
  withdraw: 'withdrawn',
}

export async function runPipelineAction(input: PipelineActionInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = PipelineActionSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const { application_id, action, notes, assigned_staff_id } = parsed.data

  const { data: application, error: appError } = await supabase
    .from('enrollment_applications')
    .select('*')
    .eq('id', application_id)
    .eq('tenant_id', tenantId)
    .single()

  if (appError || !application) {
    return { ok: false, error: 'Application not found' }
  }

  const newStage = STAGE_MAP[action]
  const now = new Date().toISOString()

  const updates: Record<string, unknown> = {
    pipeline_stage: newStage,
    updated_at: now,
  }

  if (action === 'accept_and_invite_interview') {
    updates.triage_status = 'approved'
    updates.approved_at = now
    updates.approved_by = actorId
  } else if (action === 'mark_interview_complete') {
    updates.interview_completed_at = now
    if (notes) updates.interview_notes = notes
  } else if (action === 'send_offer') {
    updates.offer_sent_at = now
  } else if (action === 'accept_offer') {
    updates.offer_accepted_at = now
  } else if (action === 'reject') {
    updates.triage_status = 'rejected'
  } else if (action === 'waitlist') {
    updates.triage_status = 'waitlisted'
  }

  const { error: updateError } = await supabase
    .from('enrollment_applications')
    .update(updates)
    .eq('id', application_id)
    .eq('tenant_id', tenantId)

  if (updateError) return { ok: false, error: updateError.message }

  await supabase.from('application_pipeline_steps').insert({
    tenant_id: tenantId,
    application_id,
    step_type: newStage,
    status: 'active',
    assigned_to: assigned_staff_id ?? null,
    notes: notes ?? null,
    completed_by: actorId,
  })

  // Complete the previous active step
  await supabase
    .from('application_pipeline_steps')
    .update({ status: 'completed', completed_at: now, completed_by: actorId })
    .eq('application_id', application_id)
    .eq('status', 'active')
    .neq('step_type', newStage)

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: `enrollment.pipeline.${action}`,
    entityType: 'enrollment_application',
    entityId: application_id,
    before: { pipeline_stage: application.pipeline_stage },
    after: { pipeline_stage: newStage, notes },
  })

  return { ok: true }
}

export async function recordInitialPipelineStep(
  applicationId: string,
  tenantId: string,
  notes?: string,
): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('application_pipeline_steps').insert({
    tenant_id: tenantId,
    application_id: applicationId,
    step_type: 'form_submitted',
    status: 'active',
    notes: notes ?? null,
  })
}
