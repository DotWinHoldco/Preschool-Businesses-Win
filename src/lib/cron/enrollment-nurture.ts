// @anchor: cca.enrollment.nurture
// Drives the abandonment email sequence for in-progress enrollment_drafts:
// 6h → 24h → 72h → 1w. After the 1w mark the draft is promoted to an
// enrollment_lead with status='nurture' so it's surfaced in the leads
// workflow, and the email cadence stops.
//
// Updated_at is the anchor: every autosave bumps it, so an actively-engaged
// applicant never gets nurtured. submitted_at being non-null short-circuits
// every step (handled by the partial index + WHERE clause).

import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

interface DraftRow {
  id: string
  tenant_id: string
  parent_email: string
  parent_first_name: string | null
  parent_last_name: string | null
  parent_phone: string | null
  values: Record<string, unknown>
  current_step: number
  resume_token: string
  nurture_step: number
  updated_at: string
  source: string | null
  analytics_visitor_id: string | null
  lead_id: string | null
}

const STAGES = [
  { step: 1, idleMs: 6 * 60 * 60 * 1000 },
  { step: 2, idleMs: 24 * 60 * 60 * 1000 },
  { step: 3, idleMs: 72 * 60 * 60 * 1000 },
  { step: 4, idleMs: 7 * 24 * 60 * 60 * 1000 },
]

export interface NurtureSummary {
  scanned: number
  emails_sent: number
  emails_failed: number
  promoted_to_lead: number
}

export async function runEnrollmentNurture(): Promise<NurtureSummary> {
  const summary: NurtureSummary = {
    scanned: 0,
    emails_sent: 0,
    emails_failed: 0,
    promoted_to_lead: 0,
  }

  const supabase = createAdminClient()
  const { data: drafts, error } = await supabase
    .from('enrollment_drafts')
    .select(
      'id, tenant_id, parent_email, parent_first_name, parent_last_name, parent_phone, values, current_step, resume_token, nurture_step, updated_at, source, analytics_visitor_id, lead_id',
    )
    .is('submitted_at', null)
    .lt('nurture_step', 4)
    .limit(500)

  if (error || !drafts) {
    console.error('[enrollment-nurture] query failed', error)
    return summary
  }

  summary.scanned = drafts.length
  const now = Date.now()

  for (const draft of drafts as DraftRow[]) {
    try {
      const idleMs = now - new Date(draft.updated_at).getTime()
      // Find the deepest stage they qualify for that they haven't received yet.
      const nextStage = STAGES.find((s) => s.step === draft.nurture_step + 1 && idleMs >= s.idleMs)
      if (!nextStage) continue

      const tenantInfo = await loadTenantInfo(supabase, draft.tenant_id)
      const resumeUrl = `https://${tenantInfo.host}/enroll?draft=${encodeURIComponent(draft.resume_token)}`

      const ok = await sendNurtureEmail({
        stage: nextStage.step,
        to: draft.parent_email,
        firstName: draft.parent_first_name ?? 'there',
        tenantName: tenantInfo.name,
        resumeUrl,
        contactEmail: tenantInfo.contactEmail,
        contactPhone: tenantInfo.contactPhone,
      }).catch((e) => {
        console.error('[enrollment-nurture] send failed', e)
        return false
      })

      if (!ok) {
        summary.emails_failed += 1
        continue
      }
      summary.emails_sent += 1

      const patch: Record<string, unknown> = {
        nurture_step: nextStage.step,
        nurture_last_sent_at: new Date().toISOString(),
      }

      // Final stage → promote to enrollment_lead with nurture status.
      if (nextStage.step === 4) {
        const leadId = await promoteToLead(supabase, draft)
        if (leadId) {
          patch.lead_id = leadId
          patch.abandoned_notification_sent_at = new Date().toISOString()
          summary.promoted_to_lead += 1
        }
      }

      await supabase.from('enrollment_drafts').update(patch).eq('id', draft.id)
    } catch (e) {
      console.error('[enrollment-nurture] draft processing threw', e)
      summary.emails_failed += 1
    }
  }

  return summary
}

// ---------------------------------------------------------------------------

async function loadTenantInfo(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<{
  name: string
  host: string
  contactEmail: string | null
  contactPhone: string | null
}> {
  const [{ data: branding }, { data: domains }] = await Promise.all([
    supabase
      .from('tenant_branding')
      .select('school_name, contact_email, contact_phone')
      .eq('tenant_id', tenantId)
      .maybeSingle(),
    supabase
      .from('tenant_domains')
      .select('domain')
      .eq('tenant_id', tenantId)
      .eq('verified', true)
      .order('created_at', { ascending: true }),
  ])

  const preferredHost =
    (domains ?? [])
      .map((d) => d.domain as string)
      .find((d) => !d.startsWith('portal.') && !d.includes('preschool.businesses.win')) ??
    (domains ?? [])[0]?.domain ??
    'preschool.businesses.win'

  return {
    name: (branding?.school_name as string | undefined) ?? 'Crandall Christian Academy',
    host: preferredHost as string,
    contactEmail: (branding?.contact_email as string | undefined) ?? null,
    contactPhone: (branding?.contact_phone as string | undefined) ?? null,
  }
}

async function promoteToLead(
  supabase: ReturnType<typeof createAdminClient>,
  draft: DraftRow,
): Promise<string | null> {
  if (draft.lead_id) return draft.lead_id

  // Avoid duplicate leads for the same email.
  const { data: existing } = await supabase
    .from('enrollment_leads')
    .select('id')
    .eq('tenant_id', draft.tenant_id)
    .eq('parent_email', draft.parent_email)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return existing.id as string

  const child = (draft.values?.children as Array<Record<string, unknown>> | undefined)?.[0]
  const childName = child
    ? `${(child.first_name as string) ?? ''} ${(child.last_name as string) ?? ''}`.trim() || null
    : null

  const { data: lead, error } = await supabase
    .from('enrollment_leads')
    .insert({
      tenant_id: draft.tenant_id,
      source: 'nurture_sequence_complete',
      source_detail: draft.source ?? 'enroll_form_abandoned',
      parent_first_name: draft.parent_first_name,
      parent_last_name: draft.parent_last_name,
      parent_email: draft.parent_email,
      parent_phone: draft.parent_phone,
      child_name: childName,
      program_interest: child?.program_type ?? null,
      status: 'nurture',
      priority: 'cold',
      notes:
        'Auto-created from abandoned enrollment application. ' +
        'Nurture sequence (6h / 24h / 72h / 1w) completed without submission.',
    })
    .select('id')
    .single()

  if (error || !lead) {
    console.error('[enrollment-nurture] promote-to-lead failed', error)
    return null
  }
  return lead.id as string
}

interface SendArgs {
  stage: number
  to: string
  firstName: string
  tenantName: string
  resumeUrl: string
  contactEmail: string | null
  contactPhone: string | null
}

async function sendNurtureEmail(args: SendArgs): Promise<boolean> {
  const { stage, to, firstName, tenantName, resumeUrl, contactEmail, contactPhone } = args
  const subject = pickSubject(stage, tenantName)
  const html = renderEmail({ stage, firstName, tenantName, resumeUrl, contactEmail, contactPhone })
  await sendEmail({ to, subject, html })
  return true
}

function pickSubject(stage: number, tenantName: string): string {
  switch (stage) {
    case 1:
      return `Your ${tenantName} application is saved`
    case 2:
      return `Pick up where you left off`
    case 3:
      return `Just 5 minutes — finish your application?`
    case 4:
      return `One last note from ${tenantName}`
    default:
      return `Your ${tenantName} application`
  }
}

function renderEmail(opts: {
  stage: number
  firstName: string
  tenantName: string
  resumeUrl: string
  contactEmail: string | null
  contactPhone: string | null
}): string {
  const { stage, firstName, tenantName, resumeUrl, contactEmail, contactPhone } = opts
  const safeName = escapeHtml(firstName)
  const safeTenant = escapeHtml(tenantName)
  const headline = STAGE_COPY[stage]?.headline ?? 'Your application is waiting'
  const body = STAGE_COPY[stage]?.body(safeName, safeTenant) ?? ''
  const ctaLabel = stage < 4 ? 'Resume my application' : 'Pick up my application'
  const contactBlock = renderContactBlock({ contactEmail, contactPhone, tenantName: safeTenant })

  return `<!doctype html>
<html><body style="margin:0;background:#faf9f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141413;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td>
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b78;letter-spacing:0.04em;text-transform:uppercase;">${safeTenant}</p>
          <h1 style="margin:0 0 14px;font-size:24px;font-weight:700;color:#141413;">${escapeHtml(headline)}</h1>
          ${body}
          <p style="margin:28px 0 8px;text-align:center;">
            <a href="${resumeUrl}" style="display:inline-block;background:#3b70b0;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:9999px;">${ctaLabel}</a>
          </p>
          <p style="margin:8px 0 0;font-size:12px;color:#9b9ba8;text-align:center;">Or copy this link: ${resumeUrl}</p>
          ${contactBlock}
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9b9ba8;">© ${new Date().getFullYear()} ${safeTenant}</p>
    </td></tr>
  </table>
</body></html>`
}

const STAGE_COPY: Record<number, { headline: string; body: (n: string, t: string) => string }> = {
  1: {
    headline: 'Hi {n}, your application is saved',
    body: (n, t) =>
      `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Hi ${n},</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">We saved your ${t} application — pick up exactly where you left off whenever you have a few minutes.</p>`,
  },
  2: {
    headline: 'Still thinking it over?',
    body: (n, t) =>
      `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Hi ${n},</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Just a friendly nudge — your ${t} application is still saved. Most families finish in about five minutes once they sit down with it.</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">If you have questions about programs, pricing, or the application itself, just reply to this email — a real person reads every message.</p>`,
  },
  3: {
    headline: 'Five minutes is all it takes',
    body: (n, t) =>
      `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Hi ${n},</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Your ${t} application is still waiting — and so are we. We&rsquo;d love to learn about your child and find the right fit for your family.</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">If now isn&rsquo;t the right moment, no pressure. The link below stays active for the next several days.</p>`,
  },
  4: {
    headline: 'We&rsquo;d still love to hear from you',
    body: (n, t) =>
      `<p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Hi ${n},</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">This is the last reminder we&rsquo;ll send about your ${t} application. We don&rsquo;t want to clutter your inbox.</p>
       <p style="margin:0 0 12px;font-size:16px;line-height:1.55;">Your saved progress is still there if you&rsquo;d like to finish — and we&rsquo;d genuinely love to meet your family. If a campus tour would be more your speed first, just reply and we&rsquo;ll set one up.</p>`,
  },
}

function renderContactBlock(opts: {
  contactEmail: string | null
  contactPhone: string | null
  tenantName: string
}): string {
  const parts: string[] = []
  if (opts.contactEmail)
    parts.push(
      `<a href="mailto:${opts.contactEmail}" style="color:#3b70b0;text-decoration:none;">${opts.contactEmail}</a>`,
    )
  if (opts.contactPhone)
    parts.push(
      `<a href="tel:${opts.contactPhone.replace(/[^\d+]/g, '')}" style="color:#3b70b0;text-decoration:none;">${opts.contactPhone}</a>`,
    )
  if (parts.length === 0) return ''
  return `<hr style="border:0;border-top:1px solid #eee;margin:28px 0 16px;">
    <p style="margin:0;font-size:13px;color:#6b6b78;text-align:center;">Questions? ${parts.join(' &nbsp;·&nbsp; ')}</p>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
