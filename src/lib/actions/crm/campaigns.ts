'use server'

// @anchor: cca.crm.campaign-actions
import { revalidatePath } from 'next/cache'
import { headers } from 'next/headers'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { dispatchBroadcast, enrollAudienceInCampaign } from '@/lib/crm/campaign-send'
import { loadTenantEmailSettings, composeMailingAddress } from '@/lib/crm/send-email'

interface Result {
  ok: boolean
  error?: string
  id?: string
  count?: number
}

const CampaignUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(120),
  type: z.enum(['broadcast', 'drip']),
  audience_id: z.string().uuid().optional().nullable(),
  template_id: z.string().uuid().optional().nullable(),
  scheduled_at: z.string().datetime().optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
})

const StepsSchema = z.object({
  campaign_id: z.string().uuid(),
  steps: z
    .array(
      z.object({
        template_id: z.string().uuid(),
        delay_minutes: z
          .number()
          .int()
          .min(0)
          .max(60 * 24 * 365),
      }),
    )
    .min(1)
    .max(20),
})

async function authedAdmin() {
  const { session } = await assertRole('admin')
  const tenantId = await getTenantId()
  return { session, tenantId, supabase: createAdminClient() }
}

async function collectorBaseFromHeaders() {
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'preschool.businesses.win'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function upsertCampaign(input: unknown): Promise<Result> {
  const parsed = CampaignUpsertSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  if (data.id) {
    const { data: existing } = await supabase
      .from('email_campaigns')
      .select('id, tenant_id, status')
      .eq('id', data.id)
      .maybeSingle()
    if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
    if (existing.status === 'sent') return { ok: false, error: 'Sent campaigns are read-only.' }
    const { error } = await supabase
      .from('email_campaigns')
      .update({
        name: data.name,
        audience_id: data.audience_id ?? null,
        template_id: data.template_id ?? null,
        scheduled_at: data.scheduled_at ?? null,
        notes: data.notes ?? null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', data.id)
    if (error) return { ok: false, error: error.message }
    revalidatePath(`/portal/admin/crm/campaigns/${data.id}`)
    revalidatePath('/portal/admin/crm/campaigns')
    return { ok: true, id: data.id }
  }

  const { data: inserted, error } = await supabase
    .from('email_campaigns')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      type: data.type,
      audience_id: data.audience_id ?? null,
      template_id: data.template_id ?? null,
      scheduled_at: data.scheduled_at ?? null,
      notes: data.notes ?? null,
      status: 'draft',
      created_by: session.user.id,
    })
    .select('id')
    .single()
  if (error) return { ok: false, error: error.message }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.campaign.created',
    entityType: 'email_campaign',
    entityId: inserted!.id as string,
    after: { name: data.name, type: data.type },
  })
  revalidatePath('/portal/admin/crm/campaigns')
  return { ok: true, id: inserted!.id as string }
}

export async function deleteCampaign(campaignId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: existing } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, name, status')
    .eq('id', campaignId)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (existing.status === 'sending')
    return { ok: false, error: 'Cannot delete a campaign while it is sending.' }
  const { error } = await supabase.from('email_campaigns').delete().eq('id', campaignId)
  if (error) return { ok: false, error: error.message }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.campaign.deleted',
    entityType: 'email_campaign',
    entityId: campaignId,
    after: { name: existing.name },
  })
  revalidatePath('/portal/admin/crm/campaigns')
  return { ok: true }
}

export async function setCampaignSteps(input: unknown): Promise<Result> {
  const parsed = StepsSchema.safeParse(input)
  if (!parsed.success)
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, type')
    .eq('id', parsed.data.campaign_id)
    .maybeSingle()
  if (!campaign || campaign.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  if (campaign.type !== 'drip') return { ok: false, error: 'Only drip campaigns have steps.' }

  await supabase.from('email_campaign_steps').delete().eq('campaign_id', parsed.data.campaign_id)

  const rows = parsed.data.steps.map((s, idx) => ({
    campaign_id: parsed.data.campaign_id,
    tenant_id: tenantId,
    step_index: idx,
    template_id: s.template_id,
    delay_minutes: s.delay_minutes,
  }))
  const { error } = await supabase.from('email_campaign_steps').insert(rows)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.campaign.steps_set',
    entityType: 'email_campaign',
    entityId: parsed.data.campaign_id,
    after: { count: rows.length },
  })
  revalidatePath(`/portal/admin/crm/campaigns/${parsed.data.campaign_id}`)
  return { ok: true, count: rows.length }
}

export async function sendCampaignNow(campaignId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, type, audience_id, template_id, status')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign || campaign.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }

  // Pre-flight: tenant must have a verified sender + mailing address.
  const { settings, branding } = await loadTenantEmailSettings(tenantId)
  if (!settings || !settings.from_email)
    return { ok: false, error: 'Sender is not configured. Visit CRM Settings.' }
  const addr = settings.mailing_address || composeMailingAddress(branding)
  if (!addr)
    return {
      ok: false,
      error: 'A mailing address is required by CAN-SPAM. Add it in CRM Settings.',
    }

  const collectorBase = await collectorBaseFromHeaders()
  if (campaign.type === 'broadcast') {
    if (!campaign.audience_id || !campaign.template_id) {
      return { ok: false, error: 'Pick an audience and template before sending.' }
    }
    const summary = await dispatchBroadcast({ tenantId, campaignId, collectorBase })
    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'crm.campaign.sent',
      entityType: 'email_campaign',
      entityId: campaignId,
      after: { ...summary } as Record<string, unknown>,
    })
    revalidatePath(`/portal/admin/crm/campaigns/${campaignId}`)
    return { ok: true, count: summary.sent }
  }

  if (campaign.type === 'drip') {
    if (!campaign.audience_id) return { ok: false, error: 'Drip campaigns need an audience.' }
    const enrolled = await enrollAudienceInCampaign(tenantId, campaignId, campaign.audience_id)
    await supabase.from('email_campaigns').update({ status: 'sending' }).eq('id', campaignId)
    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'crm.campaign.drip_started',
      entityType: 'email_campaign',
      entityId: campaignId,
      after: { enrolled },
    })
    revalidatePath(`/portal/admin/crm/campaigns/${campaignId}`)
    return { ok: true, count: enrolled }
  }
  return { ok: false, error: 'Unknown campaign type.' }
}

export async function pauseCampaign(campaignId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, status')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign || campaign.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  await supabase.from('email_campaigns').update({ status: 'paused' }).eq('id', campaignId)
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.campaign.paused',
    entityType: 'email_campaign',
    entityId: campaignId,
  })
  revalidatePath(`/portal/admin/crm/campaigns/${campaignId}`)
  return { ok: true }
}

export async function resumeCampaign(campaignId: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: campaign } = await supabase
    .from('email_campaigns')
    .select('id, tenant_id, status, type')
    .eq('id', campaignId)
    .maybeSingle()
  if (!campaign || campaign.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  await supabase
    .from('email_campaigns')
    .update({ status: campaign.type === 'drip' ? 'sending' : 'draft' })
    .eq('id', campaignId)
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.campaign.resumed',
    entityType: 'email_campaign',
    entityId: campaignId,
  })
  revalidatePath(`/portal/admin/crm/campaigns/${campaignId}`)
  return { ok: true }
}
