// @anchor: platform.system-forms.seeding
// Idempotent seeding of platform-provided system forms into a tenant.
// Server-only utility (not a Server Action — callers already run on the server).

import type { SupabaseClient } from '@supabase/supabase-js'
import { SYSTEM_FORM_TEMPLATES, type SystemFormTemplate } from './system-forms'

export interface SeedResult {
  seeded: number
  skipped: number
  errors: string[]
}

export async function seedSystemFormsForTenant(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<SeedResult> {
  const result: SeedResult = { seeded: 0, skipped: 0, errors: [] }

  for (const template of SYSTEM_FORM_TEMPLATES) {
    try {
      const { data: existing } = await supabase
        .from('forms')
        .select('id')
        .eq('tenant_id', tenantId)
        .eq('system_form_key', template.key)
        .is('parent_form_id', null)
        .maybeSingle()

      if (existing) {
        result.skipped += 1
        continue
      }

      await seedSingleTemplate(supabase, tenantId, template)
      result.seeded += 1
    } catch (err) {
      result.errors.push(`${template.key}: ${err instanceof Error ? err.message : String(err)}`)
    }
  }

  return result
}

async function seedSingleTemplate(
  supabase: SupabaseClient,
  tenantId: string,
  template: SystemFormTemplate,
): Promise<string> {
  const { data: form, error: formError } = await supabase
    .from('forms')
    .insert({
      tenant_id: tenantId,
      title: template.title,
      slug: template.slug,
      description: template.description,
      status: 'published',
      mode: template.mode,
      access_control: template.access_control,
      is_system_form: true,
      system_form_key: template.key,
      fee_enabled: template.fee_enabled ?? false,
      fee_amount_cents: template.fee_amount_cents ?? null,
      fee_description: template.fee_description ?? 'Application Fee',
      thank_you_title: template.thank_you_title,
      thank_you_message: template.thank_you_message,
      header_config: template.header_config ?? {},
      published_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (formError || !form) {
    throw new Error(formError?.message ?? 'failed to insert form')
  }

  const formId = form.id as string

  const sectionIdsByIndex: Record<number, string> = {}
  for (let i = 0; i < template.sections.length; i += 1) {
    const section = template.sections[i]
    const { data: sectionRow, error: sectionError } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        title: section.title,
        description: section.description ?? null,
        sort_order: i,
        page_number: section.page_number,
      })
      .select('id')
      .single()

    if (sectionError || !sectionRow) {
      throw new Error(sectionError?.message ?? 'failed to insert section')
    }
    sectionIdsByIndex[i] = sectionRow.id as string
  }

  if (template.fields.length > 0) {
    const fieldRows = template.fields.map((f) => ({
      form_id: formId,
      section_id: sectionIdsByIndex[f.section_index] ?? null,
      field_key: f.field_key,
      field_type: f.field_type,
      label: f.label ?? null,
      description: f.description ?? null,
      placeholder: f.placeholder ?? null,
      config: f.config ?? {},
      validation_rules: f.validation_rules ?? {},
      logic_rules: f.logic_rules ?? [],
      sort_order: f.sort_order,
      page_number: f.page_number,
      is_required: f.is_required ?? false,
      is_locked: f.is_locked ?? false,
      is_system_field: f.is_system_field ?? false,
    }))

    const { error: fieldsError } = await supabase.from('form_fields').insert(fieldRows)
    if (fieldsError) {
      throw new Error(fieldsError.message)
    }
  }

  if (template.actions.length > 0) {
    const actionRows = template.actions.map((a) => ({
      form_id: formId,
      action_type: a.action_type,
      config: a.config,
      sort_order: a.sort_order,
      is_active: true,
    }))

    const { error: actionsError } = await supabase.from('form_submission_actions').insert(actionRows)
    if (actionsError) {
      throw new Error(actionsError.message)
    }
  }

  return formId
}

/** Spawn a deep copy of a form with independent settings. */
export async function spawnFormInstance(
  supabase: SupabaseClient,
  tenantId: string,
  sourceFormId: string,
  opts: {
    instanceLabel: string
    feeEnabled?: boolean
    feeAmountCents?: number | null
    feeDescription?: string | null
  },
): Promise<{ id: string; slug: string }> {
  const { data: source, error: sourceError } = await supabase
    .from('forms')
    .select('*')
    .eq('id', sourceFormId)
    .eq('tenant_id', tenantId)
    .single()

  if (sourceError || !source) {
    throw new Error(sourceError?.message ?? 'source form not found')
  }

  const newSlug = `${source.slug}-${Date.now().toString(36)}`

  const { data: newForm, error: insertError } = await supabase
    .from('forms')
    .insert({
      tenant_id: tenantId,
      title: `${source.title} — ${opts.instanceLabel}`,
      slug: newSlug,
      description: source.description,
      status: 'draft',
      mode: source.mode,
      access_control: source.access_control,
      theme_overrides: source.theme_overrides,
      header_config: source.header_config,
      footer_config: source.footer_config,
      background_config: source.background_config,
      is_system_form: source.is_system_form,
      system_form_key: source.system_form_key,
      parent_form_id: source.id,
      instance_label: opts.instanceLabel,
      fee_enabled: opts.feeEnabled ?? false,
      fee_amount_cents: opts.feeAmountCents ?? null,
      fee_description: opts.feeDescription ?? source.fee_description ?? 'Application Fee',
      thank_you_title: source.thank_you_title,
      thank_you_message: source.thank_you_message,
    })
    .select('id, slug')
    .single()

  if (insertError || !newForm) {
    throw new Error(insertError?.message ?? 'failed to insert instance')
  }

  const { data: sections } = await supabase
    .from('form_sections')
    .select('*')
    .eq('form_id', source.id)
    .order('sort_order', { ascending: true })

  const sectionIdMap: Record<string, string> = {}
  for (const section of sections ?? []) {
    const { data: newSection } = await supabase
      .from('form_sections')
      .insert({
        form_id: newForm.id,
        title: section.title,
        description: section.description,
        sort_order: section.sort_order,
        page_number: section.page_number,
        logic_rules: section.logic_rules,
      })
      .select('id')
      .single()
    if (newSection) sectionIdMap[section.id] = newSection.id
  }

  const { data: fields } = await supabase
    .from('form_fields')
    .select('*')
    .eq('form_id', source.id)
    .order('sort_order', { ascending: true })

  if (fields && fields.length > 0) {
    const newFields = fields.map((f) => ({
      form_id: newForm.id,
      section_id: f.section_id ? sectionIdMap[f.section_id] ?? null : null,
      field_key: f.field_key,
      field_type: f.field_type,
      label: f.label,
      description: f.description,
      placeholder: f.placeholder,
      config: f.config,
      validation_rules: f.validation_rules,
      logic_rules: f.logic_rules,
      prefill_source: f.prefill_source,
      sort_order: f.sort_order,
      page_number: f.page_number,
      is_required: f.is_required,
      is_locked: f.is_locked,
      is_system_field: f.is_system_field,
    }))
    await supabase.from('form_fields').insert(newFields)
  }

  const { data: actions } = await supabase
    .from('form_submission_actions')
    .select('*')
    .eq('form_id', source.id)

  if (actions && actions.length > 0) {
    await supabase.from('form_submission_actions').insert(
      actions.map((a) => ({
        form_id: newForm.id,
        action_type: a.action_type,
        config: a.config,
        sort_order: a.sort_order,
        is_active: a.is_active,
      })),
    )
  }

  return { id: newForm.id as string, slug: newForm.slug as string }
}
