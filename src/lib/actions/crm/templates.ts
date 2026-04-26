'use server'

// @anchor: cca.crm.templates
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import {
  sendCampaignEmail,
  loadTenantEmailSettings,
  composeMailingAddress,
} from '@/lib/crm/send-email'
import { headers } from 'next/headers'

interface Result {
  ok: boolean
  error?: string
  id?: string
  send_id?: string
}

const TemplateUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  subject: z.string().trim().min(1).max(200),
  preheader: z.string().trim().max(160).optional().nullable(),
  html: z.string().trim().min(1),
  design_json: z.record(z.string(), z.unknown()).default({}),
})

const TestSendSchema = z.object({
  template_id: z.string().uuid(),
  to_email: z.string().trim().toLowerCase().email(),
})

function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

async function authedAdmin() {
  const { session } = await assertRole('admin')
  const tenantId = await getTenantId()
  return { session, tenantId, supabase: createAdminClient() }
}

export async function upsertTemplate(input: unknown): Promise<Result> {
  const parsed = TemplateUpsertSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const slug = slugify(data.name)
  if (!slug) return { ok: false, error: 'Name must contain letters or numbers.' }

  if (data.id) {
    const { data: existing } = await supabase
      .from('email_templates')
      .select('id, tenant_id, is_system')
      .eq('id', data.id)
      .maybeSingle()
    if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
    if (existing.is_system)
      return { ok: false, error: 'System templates can only be cloned, not edited.' }
    const { error } = await supabase
      .from('email_templates')
      .update({
        name: data.name,
        slug,
        subject: data.subject,
        preheader: data.preheader ?? null,
        html: data.html,
        design_json: data.design_json,
        text: '',
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) return { ok: false, error: error.message }
    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'crm.template.updated',
      entityType: 'email_template',
      entityId: data.id,
      after: { name: data.name },
    })
    revalidatePath('/portal/admin/crm/templates')
    revalidatePath(`/portal/admin/crm/templates/${data.id}`)
    return { ok: true, id: data.id }
  }

  const { data: inserted, error } = await supabase
    .from('email_templates')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      slug,
      subject: data.subject,
      preheader: data.preheader ?? null,
      html: data.html,
      design_json: data.design_json,
      text: '',
      created_by: session.user.id,
    })
    .select('id')
    .single()
  if (error) {
    if ((error as { code?: string }).code === '23505')
      return { ok: false, error: 'A template with that name already exists.' }
    return { ok: false, error: error.message }
  }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.template.created',
    entityType: 'email_template',
    entityId: inserted!.id as string,
    after: { name: data.name },
  })
  revalidatePath('/portal/admin/crm/templates')
  return { ok: true, id: inserted!.id as string }
}

export async function deleteTemplate(templateId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: existing } = await supabase
    .from('email_templates')
    .select('id, tenant_id, is_system, name')
    .eq('id', templateId)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (existing.is_system) return { ok: false, error: 'System templates cannot be deleted.' }
  const { error } = await supabase.from('email_templates').delete().eq('id', templateId)
  if (error) return { ok: false, error: error.message }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.template.deleted',
    entityType: 'email_template',
    entityId: templateId,
    after: { name: existing.name },
  })
  revalidatePath('/portal/admin/crm/templates')
  return { ok: true }
}

export async function sendTestEmail(input: unknown): Promise<Result> {
  const parsed = TestSendSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: tpl } = await supabase
    .from('email_templates')
    .select('id, tenant_id, name, subject, preheader, html')
    .eq('id', parsed.data.template_id)
    .maybeSingle()
  if (!tpl || tpl.tenant_id !== tenantId) return { ok: false, error: 'Template not found' }

  const { settings, branding } = await loadTenantEmailSettings(tenantId)
  if (!settings || !settings.from_email) {
    return { ok: false, error: 'Tenant email sender is not configured. Visit CRM Settings.' }
  }
  const mailingAddress = settings.mailing_address || composeMailingAddress(branding)
  if (!mailingAddress) {
    return {
      ok: false,
      error: 'A mailing address is required by CAN-SPAM. Add it in CRM Settings.',
    }
  }

  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'preschool.businesses.win'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  const collectorBase = `${proto}://${host}`

  const result = await sendCampaignEmail({
    tenantId,
    contactId: null,
    toEmail: parsed.data.to_email,
    templateId: tpl.id as string,
    subject: `[TEST] ${tpl.subject as string}`,
    preheader: (tpl.preheader as string | null) ?? undefined,
    bodyHtml: tpl.html as string,
    ctx: {
      contact: {
        id: 'test',
        first_name: 'Test',
        last_name: 'Recipient',
        email: parsed.data.to_email,
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
    logoUrl: (branding?.logo_path as string | undefined) ?? undefined,
    fromName: settings.from_name as string,
    fromEmail: settings.from_email as string,
    replyTo: (settings.reply_to as string | null) ?? undefined,
  })

  if (!result.ok) return { ok: false, error: result.error }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.template.test_sent',
    entityType: 'email_template',
    entityId: tpl.id as string,
    after: { to: parsed.data.to_email, send_id: result.send_id },
  })

  return { ok: true, id: tpl.id as string, send_id: result.send_id }
}
