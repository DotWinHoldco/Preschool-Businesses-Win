// @anchor: cca.crm.automations
// Automation engine: matches unprocessed crm_events against enabled
// automations, evaluates conditions, executes a sequence of actions.
// Actions are tiny and composable: send_email, add_tag, remove_tag,
// set_lifecycle, add_to_audience, enroll_in_drip, create_task.

import { createAdminClient } from '@/lib/supabase/admin'
import { sendCampaignEmail, loadTenantEmailSettings, composeMailingAddress } from './send-email'
import { enrollAudienceInCampaign } from './campaign-send'
import type { CrmEventKind } from './events'

export type AutomationAction =
  | { type: 'send_email'; template_id: string }
  | { type: 'add_tag'; tag_id: string }
  | { type: 'remove_tag'; tag_id: string }
  | { type: 'set_lifecycle'; stage: string }
  | { type: 'add_to_audience'; audience_id: string }
  | { type: 'enroll_in_drip'; campaign_id: string }
  | { type: 'create_task'; title: string; description?: string }

export interface AutomationCondition {
  match?: 'all' | 'any'
  rules?: Array<{
    field:
      | 'contact.lifecycle_stage'
      | 'contact.has_tag'
      | 'contact.email_subscribed'
      | 'contact.source'
      | 'payload.equals'
    op: 'equals' | 'not_equals' | 'in' | 'not_in' | 'is_true' | 'is_false' | 'has_any' | 'has_all'
    value?: unknown
    key?: string // for payload.equals
  }>
}

export interface AutomationRow {
  id: string
  tenant_id: string
  name: string
  trigger_kind: CrmEventKind
  conditions_json: AutomationCondition
  actions_json: AutomationAction[]
  is_enabled: boolean
  cooldown_minutes: number
  max_runs_per_contact: number | null
}

export interface ProcessSummary {
  events: number
  matched: number
  skipped: number
  ran: number
  failed: number
}

interface CrmEventRow {
  id: string
  tenant_id: string
  contact_id: string | null
  kind: CrmEventKind
  payload: Record<string, unknown>
}

export async function processPendingEvents(collectorBase: string): Promise<ProcessSummary> {
  const summary: ProcessSummary = { events: 0, matched: 0, skipped: 0, ran: 0, failed: 0 }
  const supabase = createAdminClient()

  // Pull a batch of unprocessed events.
  const { data: events } = await supabase
    .from('crm_events')
    .select('id, tenant_id, contact_id, kind, payload')
    .is('processed_at', null)
    .order('occurred_at', { ascending: true })
    .limit(200)

  if (!events || events.length === 0) return summary
  summary.events = events.length

  for (const ev of events as CrmEventRow[]) {
    try {
      const { data: autos } = await supabase
        .from('crm_automations')
        .select(
          'id, tenant_id, name, trigger_kind, conditions_json, actions_json, is_enabled, cooldown_minutes, max_runs_per_contact',
        )
        .eq('tenant_id', ev.tenant_id)
        .eq('trigger_kind', ev.kind)
        .eq('is_enabled', true)

      for (const auto of (autos ?? []) as AutomationRow[]) {
        const decision = await evaluateMatch(auto, ev, supabase)
        if (!decision.match) {
          summary.skipped += 1
          continue
        }
        summary.matched += 1
        const ran = await executeAutomation(auto, ev, collectorBase, supabase)
        if (ran === 'ran') summary.ran += 1
        else if (ran === 'failed') summary.failed += 1
        else summary.skipped += 1
      }
    } catch (e) {
      console.error('[automations] event', ev.id, e)
      summary.failed += 1
    } finally {
      await supabase
        .from('crm_events')
        .update({ processed_at: new Date().toISOString() })
        .eq('id', ev.id)
    }
  }

  return summary
}

async function evaluateMatch(
  auto: AutomationRow,
  ev: CrmEventRow,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ match: boolean; reason?: string }> {
  const cond = auto.conditions_json ?? {}
  const rules = cond.rules ?? []
  if (rules.length === 0) return { match: true }

  // Load contact once if any rule needs it.
  let contact: Record<string, unknown> | null = null
  let tagIds = new Set<string>()
  const needsContact = rules.some((r) => r.field.startsWith('contact.'))
  if (needsContact && ev.contact_id) {
    const { data } = await supabase
      .from('contacts')
      .select('id, lifecycle_stage, source, email_subscribed')
      .eq('id', ev.contact_id)
      .maybeSingle()
    contact = data
    const needsTags = rules.some((r) => r.field === 'contact.has_tag')
    if (needsTags) {
      const { data: assigns } = await supabase
        .from('contact_tag_assignments')
        .select('tag_id')
        .eq('contact_id', ev.contact_id)
      tagIds = new Set((assigns ?? []).map((a) => a.tag_id as string))
    }
  }

  const checks = rules.map((rule) => {
    switch (rule.field) {
      case 'contact.lifecycle_stage': {
        const v = (contact?.lifecycle_stage as string) ?? ''
        if (rule.op === 'equals') return v === rule.value
        if (rule.op === 'not_equals') return v !== rule.value
        if (rule.op === 'in') return Array.isArray(rule.value) && rule.value.includes(v)
        if (rule.op === 'not_in') return Array.isArray(rule.value) && !rule.value.includes(v)
        return false
      }
      case 'contact.source': {
        const v = (contact?.source as string) ?? ''
        if (rule.op === 'equals') return v === rule.value
        if (rule.op === 'in') return Array.isArray(rule.value) && rule.value.includes(v)
        return false
      }
      case 'contact.email_subscribed': {
        const v = contact?.email_subscribed === true
        if (rule.op === 'is_true') return v
        if (rule.op === 'is_false') return !v
        return false
      }
      case 'contact.has_tag': {
        const want = Array.isArray(rule.value) ? (rule.value as string[]) : [String(rule.value)]
        if (rule.op === 'has_any') return want.some((t) => tagIds.has(t))
        if (rule.op === 'has_all') return want.every((t) => tagIds.has(t))
        return false
      }
      case 'payload.equals': {
        const key = rule.key
        if (!key) return false
        const v = ev.payload?.[key]
        return v === rule.value
      }
      default:
        return false
    }
  })

  const match = cond.match === 'any' ? checks.some(Boolean) : checks.every(Boolean)
  return { match }
}

async function executeAutomation(
  auto: AutomationRow,
  ev: CrmEventRow,
  collectorBase: string,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<'ran' | 'skipped' | 'failed'> {
  // Cooldown / max-runs check.
  if (ev.contact_id && (auto.cooldown_minutes > 0 || auto.max_runs_per_contact)) {
    const { data: prior } = await supabase
      .from('crm_automation_runs')
      .select('id, started_at')
      .eq('automation_id', auto.id)
      .eq('contact_id', ev.contact_id)
      .order('started_at', { ascending: false })
      .limit(50)
    if (auto.max_runs_per_contact && (prior?.length ?? 0) >= auto.max_runs_per_contact) {
      return 'skipped'
    }
    if (auto.cooldown_minutes > 0 && prior && prior.length > 0) {
      const lastTs = prior[0].started_at as string | null
      if (lastTs) {
        const minsAgo = (Date.now() - new Date(lastTs).getTime()) / 60_000
        if (minsAgo < auto.cooldown_minutes) return 'skipped'
      }
    }
  }

  const startedAt = new Date().toISOString()
  const { data: runRow, error: runErr } = await supabase
    .from('crm_automation_runs')
    .insert({
      tenant_id: auto.tenant_id,
      automation_id: auto.id,
      event_id: ev.id,
      contact_id: ev.contact_id,
      status: 'running',
      started_at: startedAt,
    })
    .select('id')
    .single()
  if (runErr || !runRow) {
    // Unique constraint violation = already ran for this event. Skip.
    return 'skipped'
  }
  const runId = runRow.id as string

  const stepResults: Array<{ type: string; ok: boolean; detail?: string }> = []
  let failed = false
  for (const action of auto.actions_json ?? []) {
    try {
      const result = await runAction(action, auto, ev, collectorBase, supabase)
      stepResults.push({ type: action.type, ok: result.ok, detail: result.detail })
      if (!result.ok) failed = true
    } catch (e) {
      stepResults.push({
        type: action.type,
        ok: false,
        detail: e instanceof Error ? e.message : 'threw',
      })
      failed = true
    }
  }

  await supabase
    .from('crm_automation_runs')
    .update({
      status: failed ? 'failed' : 'completed',
      finished_at: new Date().toISOString(),
      step_results: stepResults,
    })
    .eq('id', runId)

  const { data: cur } = await supabase
    .from('crm_automations')
    .select('total_runs')
    .eq('id', auto.id)
    .single()
  await supabase
    .from('crm_automations')
    .update({
      total_runs: ((cur?.total_runs as number) ?? 0) + 1,
      last_run_at: new Date().toISOString(),
    })
    .eq('id', auto.id)

  return failed ? 'failed' : 'ran'
}

async function runAction(
  action: AutomationAction,
  auto: AutomationRow,
  ev: CrmEventRow,
  collectorBase: string,
  supabase: ReturnType<typeof createAdminClient>,
): Promise<{ ok: boolean; detail?: string }> {
  switch (action.type) {
    case 'add_tag': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      await supabase
        .from('contact_tag_assignments')
        .upsert(
          { tenant_id: ev.tenant_id, contact_id: ev.contact_id, tag_id: action.tag_id },
          { onConflict: 'contact_id,tag_id', ignoreDuplicates: true },
        )
      return { ok: true }
    }
    case 'remove_tag': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      await supabase
        .from('contact_tag_assignments')
        .delete()
        .eq('contact_id', ev.contact_id)
        .eq('tag_id', action.tag_id)
      return { ok: true }
    }
    case 'set_lifecycle': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      await supabase
        .from('contacts')
        .update({ lifecycle_stage: action.stage })
        .eq('id', ev.contact_id)
      return { ok: true }
    }
    case 'add_to_audience': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      await supabase.from('audience_members').upsert(
        {
          tenant_id: ev.tenant_id,
          audience_id: action.audience_id,
          contact_id: ev.contact_id,
          source: 'automation',
        },
        { onConflict: 'audience_id,contact_id', ignoreDuplicates: true },
      )
      return { ok: true }
    }
    case 'enroll_in_drip': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      const { data: firstStep } = await supabase
        .from('email_campaign_steps')
        .select('delay_minutes')
        .eq('campaign_id', action.campaign_id)
        .eq('step_index', 0)
        .maybeSingle()
      const due = new Date(
        Date.now() + ((firstStep?.delay_minutes as number) ?? 0) * 60_000,
      ).toISOString()
      await supabase.from('email_campaign_runs').upsert(
        {
          tenant_id: ev.tenant_id,
          campaign_id: action.campaign_id,
          contact_id: ev.contact_id,
          status: 'active',
          next_step_index: 0,
          next_send_at: due,
        },
        { onConflict: 'campaign_id,contact_id', ignoreDuplicates: true },
      )
      return { ok: true }
    }
    case 'create_task': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      await supabase.from('contact_activities').insert({
        tenant_id: ev.tenant_id,
        contact_id: ev.contact_id,
        activity_type: 'custom',
        title: action.title,
        body: action.description ?? null,
      })
      return { ok: true }
    }
    case 'send_email': {
      if (!ev.contact_id) return { ok: false, detail: 'no_contact' }
      const { data: contact } = await supabase
        .from('contacts')
        .select('id, email, first_name, last_name, full_name, email_subscribed')
        .eq('id', ev.contact_id)
        .maybeSingle()
      if (!contact) return { ok: false, detail: 'contact_missing' }
      if (contact.email_subscribed === false) return { ok: false, detail: 'unsubscribed' }
      const email = contact.email as string | null
      if (!email) return { ok: false, detail: 'no_email' }

      const { data: tpl } = await supabase
        .from('email_templates')
        .select('id, subject, preheader, html')
        .eq('id', action.template_id)
        .maybeSingle()
      if (!tpl) return { ok: false, detail: 'template_missing' }

      const { settings, branding } = await loadTenantEmailSettings(ev.tenant_id)
      if (!settings || !settings.from_email) return { ok: false, detail: 'sender_unconfigured' }
      const mailingAddress = settings.mailing_address || composeMailingAddress(branding)
      if (!mailingAddress) return { ok: false, detail: 'no_mailing_address' }

      const result = await sendCampaignEmail({
        tenantId: ev.tenant_id,
        contactId: contact.id as string,
        toEmail: email,
        templateId: tpl.id as string,
        campaignId: null,
        subject: tpl.subject as string,
        preheader: (tpl.preheader as string | null) ?? undefined,
        bodyHtml: tpl.html as string,
        ctx: {
          contact: {
            id: contact.id as string,
            first_name: (contact.first_name as string | null) ?? null,
            last_name: (contact.last_name as string | null) ?? null,
            full_name: (contact.full_name as string | null) ?? null,
            email,
          },
          tenant: {
            name: (branding?.school_name as string) ?? 'School',
            from_name: settings.from_name as string,
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
      return { ok: result.ok, detail: result.error }
    }
  }
}

// Re-exported so the cron route can import everything from one place.
export { enrollAudienceInCampaign }
