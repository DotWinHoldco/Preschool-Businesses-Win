'use server'

// @anchor: cca.applications.pipeline.actions
// Pipeline stage transitions for enrollment applications.

import { headers } from 'next/headers'
import { PipelineActionSchema, type PipelineActionInput } from '@/lib/schemas/appointment'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'
import {
  sendCampaignEmail,
  loadTenantEmailSettings,
  composeMailingAddress,
} from '@/lib/crm/send-email'
import { emitEvent } from '@/lib/crm/events'

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
    // Upgrade applicant_parent → parent when enrolled
    if (application.parent_user_id) {
      await supabase
        .from('user_tenant_memberships')
        .update({ role: 'parent', updated_at: now })
        .eq('user_id', application.parent_user_id)
        .eq('tenant_id', tenantId)
        .eq('role', 'applicant_parent')
    }
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

  if (action === 'accept_and_invite_interview' && application.parent_email) {
    try {
      await sendInterviewInvitationViaCrm(supabase, tenantId, application)
    } catch (err) {
      console.error('[Pipeline] Interview invitation email failed:', err)
    }
  }

  return { ok: true }
}

async function sendInterviewInvitationViaCrm(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
  application: Record<string, unknown>,
): Promise<void> {
  const parentEmail = application.parent_email as string
  if (!parentEmail) return

  const [{ data: tenant }, { data: tourType }, { data: template }, settingsLoad] =
    await Promise.all([
      supabase.from('tenants').select('slug, domain').eq('id', tenantId).single(),
      supabase
        .from('appointment_types')
        .select('slug')
        .eq('tenant_id', tenantId)
        .eq('linked_pipeline_stage', 'interview_scheduled')
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('email_templates')
        .select('id, subject, preheader, html')
        .eq('tenant_id', tenantId)
        .eq('slug', 'interview_invitation')
        .maybeSingle(),
      loadTenantEmailSettings(tenantId),
    ])

  if (!tenant || !tourType || !template) {
    console.error('[Pipeline] Missing prerequisites for interview invitation', {
      hasTenant: !!tenant,
      hasTourType: !!tourType,
      hasTemplate: !!template,
    })
    return
  }

  const { settings, branding } = settingsLoad
  if (!settings || !settings.from_email) {
    console.error('[Pipeline] Sender not configured (tenant_email_settings)')
    return
  }
  const mailingAddress = settings.mailing_address || composeMailingAddress(branding)
  if (!mailingAddress) {
    console.error('[Pipeline] mailing_address missing — refusing to send (CAN-SPAM)')
    return
  }

  // Resolve a contact_id by email so the send is timeline-attached and tracking-aware.
  const { data: contactRpc } = await supabase.rpc('ensure_contact_for_email', {
    p_tenant_id: tenantId,
    p_email: parentEmail,
    p_first_name: (application.parent_first_name as string | null) ?? null,
    p_last_name: (application.parent_last_name as string | null) ?? null,
    p_phone: (application.parent_phone as string | null) ?? null,
    p_source: 'application',
    p_source_detail: 'interview_invitation',
  })
  const contactId = (contactRpc as string | null) ?? null

  // Best-effort host resolution. Falls back to the CCA marketing domain.
  let collectorBase = `https://${branding?.school_name ? 'crandallchristianacademy.com' : 'preschool.businesses.win'}`
  try {
    const h = await headers()
    const host = h.get('x-forwarded-host') ?? h.get('host')
    const proto = h.get('x-forwarded-proto') ?? 'https'
    if (host) collectorBase = `${proto}://${host}`
  } catch {
    // headers() is only valid in request scope. If absent, fall through to default.
  }

  const tenantDomain = tenant.domain ?? `${tenant.slug}.preschool.businesses.win`
  const bookingUrl =
    `https://${tenantDomain}/${tenant.slug}/book/${tourType.slug}` +
    `?application_id=${application.id}` +
    `&name=${encodeURIComponent(`${application.parent_first_name ?? ''} ${application.parent_last_name ?? ''}`.trim())}` +
    `&email=${encodeURIComponent(parentEmail)}`

  const result = await sendCampaignEmail({
    tenantId,
    contactId,
    toEmail: parentEmail,
    templateId: template.id as string,
    subject: template.subject as string,
    preheader: (template.preheader as string | null) ?? undefined,
    bodyHtml: template.html as string,
    ctx: {
      contact: {
        id: contactId ?? '',
        first_name: (application.parent_first_name as string | null) ?? null,
        last_name: (application.parent_last_name as string | null) ?? null,
        full_name:
          `${application.parent_first_name ?? ''} ${application.parent_last_name ?? ''}`.trim() ||
          null,
        email: parentEmail,
      },
      tenant: {
        name: (branding?.school_name as string) ?? 'School',
        from_name: settings.from_name as string,
        mailing_address: mailingAddress,
        support_email: (branding?.support_email as string | null) ?? null,
        support_phone: (branding?.support_phone as string | null) ?? null,
      },
      child: {
        first_name: application.student_first_name as string | null,
        last_name: application.student_last_name as string | null,
      },
      bookInterviewUrl: bookingUrl,
    },
    collectorBase,
    schoolName: (branding?.school_name as string) ?? 'School',
    mailingAddress,
    brandColor: (branding?.color_primary as string | undefined) ?? '#3b70b0',
    logoUrl: (branding?.logo_path as string | undefined) ?? undefined,
    fromName: settings.from_name as string,
    fromEmail: settings.from_email as string,
    replyTo: (settings.reply_to as string | null) ?? undefined,
  })

  if (!result.ok) {
    console.error('[Pipeline] Interview invitation send failed:', result.error)
  } else if (contactId) {
    await emitEvent({
      tenantId,
      contactId,
      kind: 'application.approved',
      payload: {
        application_id: application.id,
        invitation_send_id: result.send_id ?? null,
      },
      source: 'pipeline_action',
    })
  }
}

export async function deleteApplication(applicationId: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: application } = await supabase
    .from('enrollment_applications')
    .select('id, student_first_name, student_last_name, parent_email, parent_user_id')
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)
    .single()

  if (!application) return { ok: false, error: 'Application not found' }

  // Delete related records first (order matters for FK constraints)
  await supabase.from('appointments').delete().eq('enrollment_application_id', applicationId)

  await supabase.from('application_pipeline_steps').delete().eq('application_id', applicationId)

  const { error: deleteError } = await supabase
    .from('enrollment_applications')
    .delete()
    .eq('id', applicationId)
    .eq('tenant_id', tenantId)

  if (deleteError) return { ok: false, error: deleteError.message }

  // Check if this parent has any remaining applications
  const { count } = await supabase
    .from('enrollment_applications')
    .select('id', { count: 'exact', head: true })
    .eq('parent_email', application.parent_email)
    .eq('tenant_id', tenantId)

  // If no remaining applications, clean up lead and applicant account
  if (count === 0) {
    await supabase
      .from('enrollment_leads')
      .delete()
      .eq('parent_email', application.parent_email)
      .eq('tenant_id', tenantId)

    if (application.parent_user_id) {
      await supabase
        .from('user_tenant_memberships')
        .delete()
        .eq('user_id', application.parent_user_id)
        .eq('tenant_id', tenantId)
        .eq('role', 'applicant_parent')
    }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'enrollment.delete',
    entityType: 'enrollment_application',
    entityId: applicationId,
    before: {
      student: `${application.student_first_name} ${application.student_last_name}`,
      parent_email: application.parent_email,
    },
    after: { deleted: true },
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
