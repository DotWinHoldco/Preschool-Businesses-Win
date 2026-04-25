'use server'

// @anchor: cca.crm.automations-actions
// CRUD for automations + apply-template helper. Admin-only, tenant-scoped.

import { revalidatePath } from 'next/cache'
import { assertRole } from '@/lib/auth/session'
import { getTenantId } from '@/lib/actions/get-tenant-id'
import { createAdminClient } from '@/lib/supabase/admin'
import { writeAudit } from '@/lib/audit'
import { AutomationUpsertSchema } from '@/lib/schemas/crm'
import { AUTOMATION_TEMPLATES, type AutomationTemplate } from '@/lib/crm/automation-templates'

interface Result {
  ok: boolean
  error?: string
  id?: string
}

async function authedAdmin() {
  const { session } = await assertRole('admin')
  const tenantId = await getTenantId()
  return { session, tenantId, supabase: createAdminClient() }
}

export async function upsertAutomation(input: unknown): Promise<Result> {
  const parsed = AutomationUpsertSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Invalid input' }
  }
  const data = parsed.data

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  if (data.id) {
    const { data: existing } = await supabase
      .from('crm_automations')
      .select('id, tenant_id')
      .eq('id', data.id)
      .maybeSingle()
    if (!existing || existing.tenant_id !== tenantId) {
      return { ok: false, error: 'Not authorized' }
    }
    const { error } = await supabase
      .from('crm_automations')
      .update({
        name: data.name,
        description: data.description ?? null,
        trigger_kind: data.trigger_kind,
        conditions_json: data.conditions_json,
        actions_json: data.actions_json,
        is_enabled: data.is_enabled,
        cooldown_minutes: data.cooldown_minutes,
        max_runs_per_contact: data.max_runs_per_contact ?? null,
        template_key: data.template_key ?? null,
      })
      .eq('id', data.id)
    if (error) return { ok: false, error: error.message }
    await writeAudit(supabase, {
      tenantId,
      actorId: session.user.id,
      action: 'crm.automation.updated',
      entityType: 'crm_automation',
      entityId: data.id,
      after: { name: data.name, trigger_kind: data.trigger_kind, enabled: data.is_enabled },
    })
    revalidatePath('/portal/admin/crm/automations')
    revalidatePath(`/portal/admin/crm/automations/${data.id}`)
    return { ok: true, id: data.id }
  }

  const { data: inserted, error } = await supabase
    .from('crm_automations')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      description: data.description ?? null,
      trigger_kind: data.trigger_kind,
      conditions_json: data.conditions_json,
      actions_json: data.actions_json,
      is_enabled: data.is_enabled,
      cooldown_minutes: data.cooldown_minutes,
      max_runs_per_contact: data.max_runs_per_contact ?? null,
      template_key: data.template_key ?? null,
      created_by: session.user.id,
    })
    .select('id')
    .single()
  if (error || !inserted) return { ok: false, error: error?.message ?? 'failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.automation.created',
    entityType: 'crm_automation',
    entityId: inserted.id as string,
    after: { name: data.name, trigger_kind: data.trigger_kind },
  })
  revalidatePath('/portal/admin/crm/automations')
  return { ok: true, id: inserted.id as string }
}

export async function setAutomationEnabled(id: string, enabled: boolean): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: existing } = await supabase
    .from('crm_automations')
    .select('id, tenant_id')
    .eq('id', id)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  const { error } = await supabase
    .from('crm_automations')
    .update({ is_enabled: enabled })
    .eq('id', id)
  if (error) return { ok: false, error: error.message }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: enabled ? 'crm.automation.enabled' : 'crm.automation.disabled',
    entityType: 'crm_automation',
    entityId: id,
  })
  revalidatePath('/portal/admin/crm/automations')
  return { ok: true, id }
}

export async function deleteAutomation(id: string): Promise<Result> {
  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }
  const { data: existing } = await supabase
    .from('crm_automations')
    .select('id, tenant_id, name')
    .eq('id', id)
    .maybeSingle()
  if (!existing || existing.tenant_id !== tenantId) return { ok: false, error: 'Not authorized' }
  const { error } = await supabase.from('crm_automations').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }
  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.automation.deleted',
    entityType: 'crm_automation',
    entityId: id,
    after: { name: existing.name },
  })
  revalidatePath('/portal/admin/crm/automations')
  return { ok: true, id }
}

/**
 * Materialize a starter template into a real automation row. Returns the
 * new automation id. The actions in the template reference templates by
 * key, which we resolve to template_id at apply time. If a referenced
 * template doesn't exist yet, we skip that action with a friendly error.
 */
export async function applyAutomationTemplate(
  templateKey: string,
): Promise<Result & { missing?: string[] }> {
  const tpl = AUTOMATION_TEMPLATES.find((t) => t.key === templateKey)
  if (!tpl) return { ok: false, error: 'Template not found' }

  let session, tenantId, supabase
  try {
    ;({ session, tenantId, supabase } = await authedAdmin())
  } catch {
    return { ok: false, error: 'Not authorized' }
  }

  // Resolve email-template keys → ids for any send_email actions.
  const missing: string[] = []
  const resolvedActions = await resolveTemplateActions(tpl, tenantId, supabase, missing)

  const { data: inserted, error } = await supabase
    .from('crm_automations')
    .insert({
      tenant_id: tenantId,
      name: tpl.name,
      description: tpl.description,
      trigger_kind: tpl.trigger_kind,
      conditions_json: tpl.conditions ?? { match: 'all', rules: [] },
      actions_json: resolvedActions,
      is_enabled: false, // safety: enable explicitly after review
      cooldown_minutes: tpl.cooldown_minutes ?? 0,
      max_runs_per_contact: tpl.max_runs_per_contact ?? null,
      template_key: tpl.key,
      created_by: session.user.id,
    })
    .select('id')
    .single()
  if (error || !inserted) return { ok: false, error: error?.message ?? 'failed' }

  await writeAudit(supabase, {
    tenantId,
    actorId: session.user.id,
    action: 'crm.automation.template_applied',
    entityType: 'crm_automation',
    entityId: inserted.id as string,
    after: { template_key: tpl.key },
  })
  revalidatePath('/portal/admin/crm/automations')
  return { ok: true, id: inserted.id as string, missing: missing.length ? missing : undefined }
}

async function resolveTemplateActions(
  tpl: AutomationTemplate,
  tenantId: string,
  supabase: ReturnType<typeof createAdminClient>,
  missing: string[],
): Promise<unknown[]> {
  const out: unknown[] = []
  for (const a of tpl.actions) {
    if (a.type === 'send_email_by_key') {
      const { data: row } = await supabase
        .from('email_templates')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('slug', a.template_key)
        .maybeSingle()
      if (!row) {
        missing.push(a.template_key)
        continue
      }
      out.push({ type: 'send_email', template_id: row.id })
    } else {
      out.push(a)
    }
  }
  return out
}
