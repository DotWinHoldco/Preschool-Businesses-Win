// @anchor: cca.crm.campaign-send
// Send a broadcast (one-shot) or advance a drip step. Audience members
// are resolved at send-time so dynamic audiences pick up changes.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignEmail, loadTenantEmailSettings, composeMailingAddress } from './send-email'

export interface DispatchOptions {
  tenantId: string
  campaignId: string
  collectorBase: string
}

export interface DispatchSummary {
  recipients: number
  sent: number
  suppressed: number
  failed: number
}

/**
 * Send a broadcast campaign to every member of its audience exactly once.
 * Marks the campaign sent on completion. Idempotent via email_sends rows.
 */
export async function dispatchBroadcast(opts: DispatchOptions): Promise<DispatchSummary> {
  const summary: DispatchSummary = { recipients: 0, sent: 0, suppressed: 0, failed: 0 }
  const supabase = createAdminClient()

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, type, audience_id, template_id, status')
    .eq('id', opts.campaignId)
    .maybeSingle()
  if (!campaign || campaign.tenant_id !== opts.tenantId || campaign.type !== 'broadcast') {
    return summary
  }
  if (campaign.status === 'sent' || campaign.status === 'archived') return summary

  if (!campaign.audience_id || !campaign.template_id) return summary

  await supabase
    .from('email_campaigns')
    .update({ status: 'sending', sent_at: null })
    .eq('id', campaign.id)

  const { settings, branding } = await loadTenantEmailSettings(opts.tenantId)
  if (!settings || !settings.from_email) return summary
  const mailingAddress = settings.mailing_address || composeMailingAddress(branding)
  if (!mailingAddress) {
    await supabase.from('email_campaigns').update({ status: 'draft' }).eq('id', campaign.id)
    return summary
  }

  const { data: tpl } = await supabase
    .from('email_templates')
    .select('id, subject, preheader, html')
    .eq('id', campaign.template_id)
    .maybeSingle()
  if (!tpl) return summary

  // Resolve audience members.
  const { data: members } = await supabase
    .from('audience_members')
    .select(
      'contact_id, contacts:contact_id(id, email, first_name, last_name, full_name, email_subscribed)',
    )
    .eq('tenant_id', opts.tenantId)
    .eq('audience_id', campaign.audience_id)
    .limit(20000)

  for (const m of members ?? []) {
    const c = m.contacts as unknown as Record<string, unknown> | null
    if (!c) continue
    const email = c.email as string | null
    if (!email) continue
    if (c.email_subscribed === false) {
      summary.suppressed += 1
      continue
    }
    summary.recipients += 1

    const result = await sendCampaignEmail({
      tenantId: opts.tenantId,
      contactId: c.id as string,
      toEmail: email,
      templateId: tpl.id as string,
      campaignId: campaign.id as string,
      subject: tpl.subject as string,
      preheader: (tpl.preheader as string | null) ?? undefined,
      bodyHtml: tpl.html as string,
      ctx: {
        contact: {
          id: c.id as string,
          first_name: (c.first_name as string | null) ?? null,
          last_name: (c.last_name as string | null) ?? null,
          full_name: (c.full_name as string | null) ?? null,
          email,
        },
        tenant: {
          name: (branding?.school_name as string) ?? 'School',
          from_name: (settings.from_name as string) ?? 'School',
          mailing_address: mailingAddress,
          support_email: (branding?.support_email as string | null) ?? null,
          support_phone: (branding?.support_phone as string | null) ?? null,
        },
      },
      collectorBase: opts.collectorBase,
      schoolName: (branding?.school_name as string) ?? 'School',
      mailingAddress,
      brandColor: (branding?.color_primary as string | undefined) ?? '#3b70b0',
      fromName: settings.from_name as string,
      fromEmail: settings.from_email as string,
      replyTo: (settings.reply_to as string | null) ?? undefined,
    })

    if (result.suppressed) summary.suppressed += 1
    else if (result.ok) summary.sent += 1
    else summary.failed += 1
  }

  await supabase
    .from('email_campaigns')
    .update({
      status: 'sent',
      sent_at: new Date().toISOString(),
      recipient_count: summary.recipients,
    })
    .eq('id', campaign.id)

  return summary
}

/**
 * Tick the drip cron — sends one email per due run. Returns counts.
 */
export async function tickDripCampaigns(collectorBase: string): Promise<DispatchSummary> {
  const summary: DispatchSummary = { recipients: 0, sent: 0, suppressed: 0, failed: 0 }
  const supabase = createAdminClient()

  const nowIso = new Date().toISOString()
  const { data: due, error } = await supabase
    .from('email_campaign_runs')
    .select(
      'id, tenant_id, campaign_id, contact_id, next_step_index, contacts:contact_id(id, email, first_name, last_name, full_name, email_subscribed)',
    )
    .eq('status', 'active')
    .lte('next_send_at', nowIso)
    .limit(200)
  if (error || !due) return summary

  for (const run of due) {
    const c = run.contacts as unknown as Record<string, unknown> | null
    if (!c) continue
    const email = c.email as string | null
    summary.recipients += 1
    if (!email || c.email_subscribed === false) {
      await supabase
        .from('email_campaign_runs')
        .update({
          status: 'exited',
          exited_reason: 'unsubscribed_or_no_email',
          completed_at: nowIso,
        })
        .eq('id', run.id)
      summary.suppressed += 1
      continue
    }

    const { data: campaign } = await supabase
      .from('email_campaigns')
      .select('id, status')
      .eq('id', run.campaign_id)
      .maybeSingle()
    if (!campaign || campaign.status === 'paused' || campaign.status === 'archived') continue

    const { data: step } = await supabase
      .from('email_campaign_steps')
      .select('id, template_id, delay_minutes, step_index')
      .eq('campaign_id', run.campaign_id)
      .eq('step_index', run.next_step_index)
      .maybeSingle()

    if (!step) {
      await supabase
        .from('email_campaign_runs')
        .update({ status: 'completed', completed_at: nowIso })
        .eq('id', run.id)
      continue
    }

    const { data: tpl } = await supabase
      .from('email_templates')
      .select('subject, preheader, html')
      .eq('id', step.template_id)
      .maybeSingle()
    if (!tpl) continue

    const { settings, branding } = await loadTenantEmailSettings(run.tenant_id as string)
    if (!settings) continue
    const mailingAddress = settings.mailing_address || composeMailingAddress(branding)
    if (!mailingAddress) continue

    const result = await sendCampaignEmail({
      tenantId: run.tenant_id as string,
      contactId: c.id as string,
      toEmail: email,
      templateId: step.template_id as string,
      campaignId: run.campaign_id as string,
      campaignStepId: step.id as string,
      subject: tpl.subject as string,
      preheader: (tpl.preheader as string | null) ?? undefined,
      bodyHtml: tpl.html as string,
      ctx: {
        contact: {
          id: c.id as string,
          first_name: (c.first_name as string | null) ?? null,
          last_name: (c.last_name as string | null) ?? null,
          full_name: (c.full_name as string | null) ?? null,
          email,
        },
        tenant: {
          name: (branding?.school_name as string) ?? 'School',
          from_name: (settings.from_name as string) ?? 'School',
          mailing_address: mailingAddress,
          support_email: (branding?.support_email as string | null) ?? null,
          support_phone: (branding?.support_phone as string | null) ?? null,
        },
      },
      collectorBase,
      schoolName: (branding?.school_name as string) ?? 'School',
      mailingAddress,
      brandColor: (branding?.color_primary as string | undefined) ?? '#3b70b0',
      fromName: settings.from_name as string,
      fromEmail: settings.from_email as string,
      replyTo: (settings.reply_to as string | null) ?? undefined,
    })

    if (!result.ok) {
      summary.failed += 1
      // We still advance — failed sends don't block the funnel.
    } else {
      summary.sent += 1
    }

    // Look up the next step's delay to schedule.
    const { data: nextStep } = await supabase
      .from('email_campaign_steps')
      .select('step_index, delay_minutes')
      .eq('campaign_id', run.campaign_id)
      .eq('step_index', (step.step_index as number) + 1)
      .maybeSingle()

    if (!nextStep) {
      await supabase
        .from('email_campaign_runs')
        .update({
          next_step_index: (step.step_index as number) + 1,
          status: 'completed',
          completed_at: nowIso,
          last_send_id: result.send_id ?? null,
        })
        .eq('id', run.id)
    } else {
      const due = new Date(
        Date.now() + ((nextStep.delay_minutes as number) || 0) * 60_000,
      ).toISOString()
      await supabase
        .from('email_campaign_runs')
        .update({
          next_step_index: nextStep.step_index as number,
          next_send_at: due,
          last_send_id: result.send_id ?? null,
        })
        .eq('id', run.id)
    }
  }

  return summary
}

/**
 * Enroll the members of an audience into a drip campaign. Idempotent —
 * already-enrolled contacts are skipped.
 */
export async function enrollAudienceInCampaign(
  tenantId: string,
  campaignId: string,
  audienceId: string,
): Promise<number> {
  const supabase = createAdminClient()
  const { data: members } = await supabase
    .from('audience_members')
    .select('contact_id')
    .eq('tenant_id', tenantId)
    .eq('audience_id', audienceId)
    .limit(20000)

  const ids = (members ?? []).map((m) => m.contact_id as string)
  if (ids.length === 0) return 0

  const { data: firstStep } = await supabase
    .from('email_campaign_steps')
    .select('delay_minutes')
    .eq('campaign_id', campaignId)
    .eq('step_index', 0)
    .maybeSingle()
  const due = new Date(
    Date.now() + ((firstStep?.delay_minutes as number) ?? 0) * 60_000,
  ).toISOString()

  const rows = ids.map((cid) => ({
    tenant_id: tenantId,
    campaign_id: campaignId,
    contact_id: cid,
    status: 'active' as const,
    next_step_index: 0,
    next_send_at: due,
  }))
  const CHUNK = 1000
  let inserted = 0
  for (let i = 0; i < rows.length; i += CHUNK) {
    const slice = rows.slice(i, i + CHUNK)
    const { count } = await supabase
      .from('email_campaign_runs')
      .upsert(slice, {
        onConflict: 'campaign_id,contact_id',
        ignoreDuplicates: true,
        count: 'exact',
      })
    inserted += count ?? 0
  }
  return inserted
}
