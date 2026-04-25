// @anchor: cca.crm.send
// Single send pipeline used by templates, broadcasts, drips, and
// transactional automations. Inserts an email_sends row with tracking
// tokens, renders the email through email-render, posts to Resend, and
// returns the send id. Suppression list is checked before any of that.

import { randomBytes } from 'node:crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { renderEmail, extractLinks } from './email-render'
import { getResendClient } from '@/lib/email/resend'
import type { MergeContext } from './merge-tags'

export interface SendArgs {
  tenantId: string
  contactId: string | null
  toEmail: string
  templateId?: string | null
  campaignId?: string | null
  campaignStepId?: string | null
  subject: string
  preheader?: string
  bodyHtml: string // raw TipTap HTML
  ctx: Omit<MergeContext, 'unsubscribeUrl'>
  collectorBase: string // host running the click/open endpoints
  schoolName: string
  mailingAddress: string
  brandColor?: string
  fromName: string
  fromEmail: string
  replyTo?: string
}

export interface SendResult {
  ok: boolean
  send_id?: string
  message_id?: string
  error?: string
  suppressed?: boolean
}

function newToken(): string {
  return randomBytes(18).toString('base64url')
}

export async function sendCampaignEmail(args: SendArgs): Promise<SendResult> {
  const supabase = createAdminClient()
  const emailNorm = args.toEmail.trim().toLowerCase()
  if (!emailNorm || !emailNorm.includes('@')) {
    return { ok: false, error: 'invalid_email' }
  }

  // 1. Suppression check.
  const { data: sup } = await supabase
    .from('email_suppressions')
    .select('id, reason')
    .eq('tenant_id', args.tenantId)
    .eq('email_normalized', emailNorm)
    .maybeSingle()
  if (sup) {
    return { ok: false, suppressed: true, error: `suppressed:${sup.reason}` }
  }

  // 2. Pre-extract candidate links so we can mint tokens before rendering.
  const linksRaw = extractLinks(args.bodyHtml)
  const trackedLinks = linksRaw.map((url) => ({ token: newToken(), url }))
  const openToken = newToken()
  const unsubToken = newToken()

  // 3. Insert send row first so we have an id for tracking pixel/links.
  const { data: send, error: insErr } = await supabase
    .from('email_sends')
    .insert({
      tenant_id: args.tenantId,
      contact_id: args.contactId,
      template_id: args.templateId ?? null,
      campaign_id: args.campaignId ?? null,
      campaign_step_id: args.campaignStepId ?? null,
      to_email: emailNorm,
      subject: args.subject.slice(0, 1000),
      status: 'queued',
      open_token: openToken,
      unsubscribe_token: unsubToken,
    })
    .select('id')
    .single()

  if (insErr || !send) {
    return { ok: false, error: insErr?.message ?? 'send_insert_failed' }
  }
  const sendId = send.id as string

  // Insert link rows.
  if (trackedLinks.length > 0) {
    await supabase.from('email_links').insert(
      trackedLinks.map((l) => ({
        send_id: sendId,
        tenant_id: args.tenantId,
        token: l.token,
        original_url: l.url,
      })),
    )
  }

  // 4. Render with tokens substituted in.
  const unsubscribeUrl = `${args.collectorBase}/unsubscribe/${unsubToken}`
  const ctx: MergeContext = { ...args.ctx, unsubscribeUrl, preferencesUrl: unsubscribeUrl }

  let rendered
  try {
    rendered = renderEmail({
      bodyHtml: args.bodyHtml,
      subject: args.subject,
      preheader: args.preheader,
      ctx,
      brandColor: args.brandColor,
      collectorBase: args.collectorBase,
      send: { id: sendId, openToken, trackedLinks },
      schoolName: args.schoolName,
      mailingAddress: args.mailingAddress,
    })
  } catch (e) {
    await supabase
      .from('email_sends')
      .update({
        status: 'failed',
        failed_at: new Date().toISOString(),
        failed_reason: e instanceof Error ? e.message : 'render_failed',
      })
      .eq('id', sendId)
    return { ok: false, send_id: sendId, error: 'render_failed' }
  }

  // 5. Post to Resend.
  const client = getResendClient()
  if (!client) {
    // Dev/no-key path — mark as "sent" with a mock id so the pipeline is testable.
    const mockId = `mock-${Date.now()}`
    await supabase
      .from('email_sends')
      .update({ status: 'sent', message_id: mockId, sent_at: new Date().toISOString() })
      .eq('id', sendId)
    if (args.contactId) {
      await supabase.from('contact_activities').insert({
        tenant_id: args.tenantId,
        contact_id: args.contactId,
        activity_type: 'email_sent',
        title: `Sent: ${rendered.subject}`,
        related_entity_type: 'email_send',
        related_entity_id: sendId,
      })
    }
    return { ok: true, send_id: sendId, message_id: mockId }
  }

  try {
    const { data, error } = await client.emails.send({
      from: `${args.fromName} <${args.fromEmail}>`,
      to: [emailNorm],
      replyTo: args.replyTo ?? args.fromEmail,
      subject: rendered.subject,
      html: rendered.html,
      text: rendered.text,
      headers: {
        'List-Unsubscribe': `<${unsubscribeUrl}>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
      },
      tags: [
        { name: 'tenant_id', value: args.tenantId.slice(0, 36) },
        ...(args.campaignId ? [{ name: 'campaign_id', value: args.campaignId.slice(0, 36) }] : []),
        ...(args.templateId ? [{ name: 'template_id', value: args.templateId.slice(0, 36) }] : []),
      ],
    })
    if (error) {
      await supabase
        .from('email_sends')
        .update({
          status: 'failed',
          failed_at: new Date().toISOString(),
          failed_reason: error.message?.slice(0, 500) ?? 'resend_error',
          provider_response: error as unknown as Record<string, unknown>,
        })
        .eq('id', sendId)
      return { ok: false, send_id: sendId, error: error.message }
    }
    const messageId = (data as { id?: string } | null)?.id ?? null
    await supabase
      .from('email_sends')
      .update({
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_id: messageId,
        provider_response: data as unknown as Record<string, unknown>,
      })
      .eq('id', sendId)

    if (args.contactId) {
      await supabase.from('contact_activities').insert({
        tenant_id: args.tenantId,
        contact_id: args.contactId,
        activity_type: 'email_sent',
        title: `Sent: ${rendered.subject}`,
        related_entity_type: 'email_send',
        related_entity_id: sendId,
      })
      await supabase
        .from('contacts')
        .update({ last_contacted_at: new Date().toISOString() })
        .eq('id', args.contactId)
    }
    return { ok: true, send_id: sendId, message_id: messageId ?? undefined }
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'send_threw'
    await supabase
      .from('email_sends')
      .update({ status: 'failed', failed_at: new Date().toISOString(), failed_reason: msg })
      .eq('id', sendId)
    return { ok: false, send_id: sendId, error: msg }
  }
}

export async function loadTenantEmailSettings(tenantId: string) {
  const supabase = createAdminClient()
  const [{ data: settings }, { data: branding }] = await Promise.all([
    supabase.from('tenant_email_settings').select('*').eq('tenant_id', tenantId).maybeSingle(),
    supabase
      .from('tenant_branding')
      .select(
        'school_name, color_primary, address_line1, address_line2, city, state, zip, support_email, support_phone',
      )
      .eq('tenant_id', tenantId)
      .maybeSingle(),
  ])
  return { settings, branding }
}

export function composeMailingAddress(branding: Record<string, unknown> | null): string {
  if (!branding) return ''
  const lines = [
    branding.address_line1,
    branding.address_line2,
    [branding.city, branding.state, branding.zip].filter(Boolean).join(', '),
  ]
    .map((l) => (typeof l === 'string' ? l.trim() : ''))
    .filter(Boolean)
  return lines.join(' · ')
}
