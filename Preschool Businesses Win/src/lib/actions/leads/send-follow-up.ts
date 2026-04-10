// @anchor: cca.leads.send-follow-up
'use server'

import { SendFollowUpSchema, type SendFollowUpInput } from '@/lib/schemas/lead'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type SendFollowUpState = {
  ok: boolean
  error?: string
}

export async function sendFollowUp(input: SendFollowUpInput): Promise<SendFollowUpState> {
  const parsed = SendFollowUpSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch lead to get contact info
  const { data: lead, error: leadError } = await supabase
    .from('enrollment_leads')
    .select('parent_email, parent_phone, parent_first_name, parent_last_name')
    .eq('id', data.lead_id)
    .single()

  if (leadError || !lead) {
    return { ok: false, error: 'Lead not found' }
  }

  // TODO: Wire to Resend (email) or Twilio (SMS) in production
  // For now, log the follow-up as an activity
  if (data.channel === 'email' && !lead.parent_email) {
    return { ok: false, error: 'Lead has no email address' }
  }
  if (data.channel === 'sms' && !lead.parent_phone) {
    return { ok: false, error: 'Lead has no phone number' }
  }

  // Add activity record
  await supabase.from('lead_activities').insert({
    tenant_id: tenantId,
    lead_id: data.lead_id,
    activity_type: data.channel === 'email' ? 'email_sent' : 'call_made',
    description: `Follow-up ${data.channel}: ${data.subject}`,
    performed_by: actorId,
  })

  // Update lead status to contacted if still new
  await supabase
    .from('enrollment_leads')
    .update({ status: 'contacted', updated_at: new Date().toISOString() })
    .eq('id', data.lead_id)
    .eq('status', 'new')

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'lead.follow_up.sent',
    entity_type: 'enrollment_lead',
    entity_id: data.lead_id,
    after: { channel: data.channel, subject: data.subject },
  })

  return { ok: true }
}
