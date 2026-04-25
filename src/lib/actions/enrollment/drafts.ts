'use server'

// @anchor: cca.enrollment.drafts
// Server-backed in-progress enrollment applications.
// - autoSaveDraft: silent upsert as soon as we have an email. No email sent.
// - sendDraftMagicLink: explicit save action — generates a fresh token and
//   emails a resume link to the parent.
// - loadDraftByToken: hydrates the form when a parent clicks their magic link.

import { randomBytes } from 'node:crypto'
import { headers } from 'next/headers'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendEmail } from '@/lib/email/resend'

const EMAIL_SCHEMA = z.string().trim().toLowerCase().email().max(254)
const NAME_SCHEMA = z.string().trim().max(80).optional().nullable()

function newToken(): string {
  return randomBytes(24).toString('base64url')
}

async function resolveTenantContext(): Promise<{ tenantId: string; host: string; proto: string }> {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) throw new Error('Missing tenant context')
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'preschool.businesses.win'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return { tenantId, host, proto }
}

// ---------------------------------------------------------------------------
// AUTO-SAVE — fires as the user types, no email sent
// ---------------------------------------------------------------------------

const AutoSaveSchema = z.object({
  email: EMAIL_SCHEMA,
  first_name: NAME_SCHEMA,
  last_name: NAME_SCHEMA,
  phone: z.string().trim().max(40).optional().nullable(),
  values: z.record(z.string(), z.unknown()).default({}),
  current_step: z.number().int().min(0).max(50).default(0),
  form_id: z.string().uuid().optional().nullable(),
  analytics_visitor_id: z.string().max(64).optional().nullable(),
  source: z.string().max(64).optional().nullable(),
})

export interface AutoSaveResult {
  ok: boolean
  draft_id?: string
  error?: string
}

export async function autoSaveDraft(input: unknown): Promise<AutoSaveResult> {
  const parsed = AutoSaveSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'invalid_payload' }
  const data = parsed.data

  let tenantId: string
  try {
    ;({ tenantId } = await resolveTenantContext())
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'tenant_context' }
  }

  try {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('enrollment_drafts')
      .select('id, resume_token')
      .eq('tenant_id', tenantId)
      .eq('parent_email', data.email)
      .maybeSingle()

    if (existing) {
      const { error } = await supabase
        .from('enrollment_drafts')
        .update({
          parent_first_name: data.first_name ?? null,
          parent_last_name: data.last_name ?? null,
          parent_phone: data.phone ?? null,
          values: data.values,
          current_step: data.current_step,
          form_id: data.form_id ?? null,
          analytics_visitor_id: data.analytics_visitor_id ?? null,
          source: data.source ?? null,
          updated_at: new Date().toISOString(),
          // Sliding 30-day expiry on every autosave touch.
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', existing.id)
      if (error) return { ok: false, error: error.message }
      return { ok: true, draft_id: existing.id as string }
    }

    const { data: inserted, error: insErr } = await supabase
      .from('enrollment_drafts')
      .insert({
        tenant_id: tenantId,
        form_id: data.form_id ?? null,
        parent_email: data.email,
        parent_first_name: data.first_name ?? null,
        parent_last_name: data.last_name ?? null,
        parent_phone: data.phone ?? null,
        values: data.values,
        current_step: data.current_step,
        resume_token: newToken(),
        analytics_visitor_id: data.analytics_visitor_id ?? null,
        source: data.source ?? null,
      })
      .select('id')
      .single()

    if (insErr || !inserted) {
      return { ok: false, error: insErr?.message ?? 'insert_failed' }
    }
    return { ok: true, draft_id: inserted.id as string }
  } catch (e) {
    console.error('[drafts/autoSave]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// SAVE + EMAIL MAGIC LINK
// ---------------------------------------------------------------------------

const SendLinkSchema = AutoSaveSchema.extend({
  email: EMAIL_SCHEMA,
  first_name: z.string().trim().min(1).max(80),
  last_name: NAME_SCHEMA,
})

export interface SendLinkResult {
  ok: boolean
  draft_id?: string
  email_id?: string
  error?: string
}

export async function sendDraftMagicLink(input: unknown): Promise<SendLinkResult> {
  const parsed = SendLinkSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'invalid' }
  }
  const data = parsed.data

  let tenantId: string
  let host: string
  let proto: string
  try {
    ;({ tenantId, host, proto } = await resolveTenantContext())
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'tenant_context' }
  }

  try {
    const supabase = createAdminClient()
    const { data: existing } = await supabase
      .from('enrollment_drafts')
      .select('id, resume_token, magic_link_send_count')
      .eq('tenant_id', tenantId)
      .eq('parent_email', data.email)
      .maybeSingle()

    let draftId: string
    let token: string
    let sendCount: number

    if (existing) {
      // Re-use existing token so prior emails still work.
      token = existing.resume_token as string
      draftId = existing.id as string
      sendCount = ((existing.magic_link_send_count as number) ?? 0) + 1
      const { error } = await supabase
        .from('enrollment_drafts')
        .update({
          parent_first_name: data.first_name,
          parent_last_name: data.last_name ?? null,
          parent_phone: data.phone ?? null,
          values: data.values,
          current_step: data.current_step,
          form_id: data.form_id ?? null,
          analytics_visitor_id: data.analytics_visitor_id ?? null,
          source: data.source ?? null,
          magic_link_sent_at: new Date().toISOString(),
          magic_link_send_count: sendCount,
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', draftId)
      if (error) return { ok: false, error: error.message }
    } else {
      token = newToken()
      const { data: inserted, error: insErr } = await supabase
        .from('enrollment_drafts')
        .insert({
          tenant_id: tenantId,
          form_id: data.form_id ?? null,
          parent_email: data.email,
          parent_first_name: data.first_name,
          parent_last_name: data.last_name ?? null,
          parent_phone: data.phone ?? null,
          values: data.values,
          current_step: data.current_step,
          resume_token: token,
          analytics_visitor_id: data.analytics_visitor_id ?? null,
          source: data.source ?? null,
          magic_link_sent_at: new Date().toISOString(),
          magic_link_send_count: 1,
        })
        .select('id')
        .single()
      if (insErr || !inserted) {
        return { ok: false, error: insErr?.message ?? 'insert_failed' }
      }
      draftId = inserted.id as string
      sendCount = 1
    }

    const resumeUrl = `${proto}://${host}/enroll?draft=${encodeURIComponent(token)}`
    const tenantName = (await getTenantName(supabase, tenantId)) ?? 'Crandall Christian Academy'

    let emailId: string | undefined
    try {
      const sent = await sendEmail({
        to: data.email,
        subject: `Resume your ${tenantName} application`,
        html: renderDraftEmail({
          firstName: data.first_name,
          tenantName,
          resumeUrl,
        }),
      })
      emailId = (sent as { id?: string } | null)?.id
    } catch (e) {
      console.error('[drafts/sendMagicLink] email failed', e)
      // Non-fatal — the draft itself is saved. Return ok with the draft id.
      return { ok: true, draft_id: draftId, error: 'email_failed' }
    }

    return { ok: true, draft_id: draftId, email_id: emailId }
  } catch (e) {
    console.error('[drafts/sendMagicLink]', e)
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// LOAD by token (called from the page on /enroll?draft=xxx)
// ---------------------------------------------------------------------------

export interface LoadedDraft {
  ok: boolean
  draft?: {
    id: string
    values: Record<string, unknown>
    current_step: number
    parent_first_name: string | null
    parent_last_name: string | null
    parent_email: string
    form_id: string | null
  }
  error?: string
}

export async function loadDraftByToken(token: string): Promise<LoadedDraft> {
  if (!token || token.length < 8) return { ok: false, error: 'invalid_token' }
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('enrollment_drafts')
      .select(
        'id, tenant_id, form_id, parent_email, parent_first_name, parent_last_name, values, current_step, expires_at, submitted_at',
      )
      .eq('resume_token', token)
      .maybeSingle()

    if (error || !data) return { ok: false, error: 'not_found' }
    if (data.submitted_at) return { ok: false, error: 'already_submitted' }
    if (new Date(data.expires_at as string).getTime() < Date.now()) {
      return { ok: false, error: 'expired' }
    }

    // Mark resumed (best-effort, non-blocking).
    await supabase
      .from('enrollment_drafts')
      .update({ resumed_at: new Date().toISOString() })
      .eq('id', data.id)

    return {
      ok: true,
      draft: {
        id: data.id as string,
        values: (data.values as Record<string, unknown>) ?? {},
        current_step: (data.current_step as number) ?? 0,
        parent_first_name: (data.parent_first_name as string | null) ?? null,
        parent_last_name: (data.parent_last_name as string | null) ?? null,
        parent_email: data.parent_email as string,
        form_id: (data.form_id as string | null) ?? null,
      },
    }
  } catch (e) {
    console.error('[drafts/loadByToken]', e)
    return { ok: false, error: 'unknown' }
  }
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

async function getTenantName(
  supabase: ReturnType<typeof createAdminClient>,
  tenantId: string,
): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('tenant_branding')
      .select('school_name')
      .eq('tenant_id', tenantId)
      .maybeSingle()
    return (data?.school_name as string | undefined) ?? null
  } catch {
    return null
  }
}

function renderDraftEmail(opts: {
  firstName: string
  tenantName: string
  resumeUrl: string
}): string {
  const { firstName, tenantName, resumeUrl } = opts
  const safeName = escapeHtml(firstName)
  const safeTenant = escapeHtml(tenantName)
  return `<!doctype html>
<html><body style="margin:0;background:#faf9f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#141413;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf9f5;padding:32px 16px;">
    <tr><td align="center">
      <table role="presentation" width="560" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border-radius:16px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
        <tr><td>
          <h1 style="margin:0 0 12px;font-size:22px;font-weight:700;color:#141413;">Hi ${safeName},</h1>
          <p style="margin:0 0 16px;font-size:16px;line-height:1.55;color:#1c1c28;">
            Your ${safeTenant} application is saved. Pick up where you left off any time within the next 30 days.
          </p>
          <p style="margin:24px 0;text-align:center;">
            <a href="${resumeUrl}" style="display:inline-block;background:#3b70b0;color:#ffffff;text-decoration:none;font-weight:600;padding:14px 28px;border-radius:9999px;">Resume my application</a>
          </p>
          <p style="margin:0 0 8px;font-size:13px;color:#6b6b78;">Or copy this link into your browser:</p>
          <p style="margin:0 0 24px;font-size:13px;color:#3b70b0;word-break:break-all;">${resumeUrl}</p>
          <hr style="border:0;border-top:1px solid #eee;margin:24px 0;">
          <p style="margin:0;font-size:12px;color:#9b9ba8;line-height:1.5;">
            We'll never share your information. If you didn't start an application, you can safely ignore this email — the link will expire automatically.
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;font-size:11px;color:#9b9ba8;">© ${new Date().getFullYear()} ${safeTenant}</p>
    </td></tr>
  </table>
</body></html>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
