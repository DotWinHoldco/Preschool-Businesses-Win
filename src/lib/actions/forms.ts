'use server'

// @anchor: platform.form-builder.actions

import { CreateFormSchema, UpdateFormSchema, CreateFormFieldSchema, SpawnFormInstanceSchema } from '@/lib/schemas/form'
import type { CreateFormInput, UpdateFormInput, CreateFormFieldInput, SpawnFormInstanceInput } from '@/lib/schemas/form'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { spawnFormInstance } from '@/lib/forms/seed-system-forms'

type ActionResult = { ok: boolean; id?: string; slug?: string; error?: string; fieldErrors?: Record<string, string> }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)
}

export async function createForm(input: CreateFormInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateFormSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const slug = slugify(parsed.data.title) + '-' + Date.now().toString(36)

  const { data: form, error } = await supabase.from('forms').insert({
    tenant_id: tenantId,
    title: parsed.data.title,
    slug,
    description: parsed.data.description,
    mode: parsed.data.mode,
    access_control: parsed.data.access_control,
    created_by: actorId,
  }).select('id, slug').single()

  if (error) return { ok: false, error: error.message }

  await supabase.from('form_submission_actions').insert({
    form_id: form.id,
    action_type: 'store',
    sort_order: 0,
    is_active: true,
  })

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'create',
    entity_type: 'form', entity_id: form.id, after_data: parsed.data,
  })

  return { ok: true, id: form.id, slug: form.slug }
}

export async function updateForm(input: UpdateFormInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateFormSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const { id, ...updates } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const updateData: Record<string, unknown> = { ...updates, updated_at: new Date().toISOString() }
  if (updates.status === 'published') {
    updateData.published_at = new Date().toISOString()
  }

  const { error } = await supabase.from('forms')
    .update(updateData).eq('id', id).eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'update',
    entity_type: 'form', entity_id: id, after_data: updates,
  })

  return { ok: true, id }
}

export async function createFormSection(input: {
  form_id: string
  title: string
  description?: string
  page_number: number
  iterate_over_field_key?: string | null
}): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { count } = await supabase
    .from('form_sections')
    .select('id', { count: 'exact', head: true })
    .eq('form_id', input.form_id)

  const { data, error } = await supabase
    .from('form_sections')
    .insert({
      form_id: input.form_id,
      title: input.title,
      description: input.description ?? null,
      sort_order: count ?? 0,
      page_number: input.page_number,
      iterate_over_field_key: input.iterate_over_field_key ?? null,
    })
    .select('id')
    .single()

  if (error || !data) return { ok: false, error: error?.message ?? 'Insert failed' }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'form.section.create',
    entity_type: 'form_section',
    entity_id: data.id,
    after_data: input,
  })

  return { ok: true, id: data.id as string }
}

export async function updateFormSection(
  id: string,
  updates: {
    title?: string | null
    description?: string | null
    page_number?: number
    iterate_over_field_key?: string | null
    sort_order?: number
  },
): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase.from('form_sections').update(updates).eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'form.section.update',
    entity_type: 'form_section',
    entity_id: id,
    after_data: updates,
  })

  return { ok: true, id }
}

export async function deleteFormSection(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // Unlink fields in this section (set section_id = null) before deleting
  await supabase.from('form_fields').update({ section_id: null }).eq('section_id', id)

  const { error } = await supabase.from('form_sections').delete().eq('id', id)
  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'form.section.delete',
    entity_type: 'form_section',
    entity_id: id,
  })

  return { ok: true }
}

export async function createFormInstance(input: SpawnFormInstanceInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = SpawnFormInstanceSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  try {
    const result = await spawnFormInstance(supabase, tenantId, parsed.data.source_form_id, {
      instanceLabel: parsed.data.instance_label,
      feeEnabled: parsed.data.fee_enabled,
      feeAmountCents: parsed.data.fee_amount_cents ?? null,
      feeDescription: parsed.data.fee_description ?? null,
    })
    await supabase.from('audit_log').insert({
      tenant_id: tenantId, actor_id: actorId, action: 'form.spawn_instance',
      entity_type: 'form', entity_id: result.id,
      after_data: { source_form_id: parsed.data.source_form_id, instance_label: parsed.data.instance_label },
    })
    return { ok: true, id: result.id, slug: result.slug }
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Failed to spawn instance' }
  }
}

export async function deleteForm(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  // System forms (primary instances) cannot be deleted — only revert or spawn instances.
  const { data: form } = await supabase
    .from('forms')
    .select('is_system_form, parent_form_id, system_form_key')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (form?.is_system_form && !form.parent_form_id) {
    return {
      ok: false,
      error: `This is a core system form (${form.system_form_key}) and cannot be deleted. Use "Revert to original" to reset it or spawn an instance to create a variant.`,
    }
  }

  const { error } = await supabase.from('forms')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'archive',
    entity_type: 'form', entity_id: id,
  })

  return { ok: true }
}

/**
 * Reverts a system form to its platform template — wipes custom fields/sections and re-seeds
 * the canonical structure. Requires a typed confirmation string to prevent accidents.
 */
export async function revertSystemForm(
  formId: string,
  confirmationText: string,
): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  if (confirmationText.trim().toUpperCase() !== 'REVERT') {
    return { ok: false, error: 'Type REVERT to confirm.' }
  }

  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('id', formId)
    .eq('tenant_id', tenantId)
    .single()

  if (!form || !form.is_system_form || !form.system_form_key) {
    return { ok: false, error: 'Not a system form.' }
  }

  // Wipe existing fields / sections / actions for this form
  await supabase.from('form_fields').delete().eq('form_id', formId)
  await supabase.from('form_sections').delete().eq('form_id', formId)
  await supabase.from('form_submission_actions').delete().eq('form_id', formId)

  // Re-seed from the platform template
  const { SYSTEM_FORM_TEMPLATES } = await import('@/lib/forms/system-forms')
  const template = SYSTEM_FORM_TEMPLATES.find((t) => t.key === form.system_form_key)
  if (!template) {
    return { ok: false, error: `No template registered for system_form_key=${form.system_form_key}` }
  }

  const sectionIds: Record<number, string> = {}
  for (let i = 0; i < template.sections.length; i += 1) {
    const s = template.sections[i]
    const { data } = await supabase
      .from('form_sections')
      .insert({
        form_id: formId,
        title: s.title,
        description: s.description ?? null,
        sort_order: i,
        page_number: s.page_number,
        iterate_over_field_key: s.iterate_over_field_key ?? null,
      })
      .select('id')
      .single()
    if (data) sectionIds[i] = data.id as string
  }

  if (template.fields.length > 0) {
    await supabase.from('form_fields').insert(
      template.fields.map((f) => ({
        form_id: formId,
        section_id: sectionIds[f.section_index] ?? null,
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
      })),
    )
  }

  if (template.actions.length > 0) {
    await supabase.from('form_submission_actions').insert(
      template.actions.map((a) => ({
        form_id: formId,
        action_type: a.action_type,
        config: a.config,
        sort_order: a.sort_order,
        is_active: true,
      })),
    )
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'form.revert',
    entity_type: 'form',
    entity_id: formId,
    after_data: { system_form_key: form.system_form_key, reverted_at: new Date().toISOString() },
  })

  return { ok: true, id: formId }
}

export async function createFormField(input: CreateFormFieldInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateFormFieldSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const supabase = createAdminClient()
  const { data: field, error } = await supabase.from('form_fields')
    .insert(parsed.data).select('id').single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: field.id }
}

export async function updateFormField(
  fieldId: string,
  updates: Partial<CreateFormFieldInput>
): Promise<ActionResult> {
  await assertRole('admin')
  const supabase = createAdminClient()

  const { error } = await supabase.from('form_fields')
    .update(updates).eq('id', fieldId)

  if (error) return { ok: false, error: error.message }
  return { ok: true, id: fieldId }
}

export async function deleteFormField(fieldId: string): Promise<ActionResult> {
  await assertRole('admin')
  const supabase = createAdminClient()

  const { error } = await supabase.from('form_fields')
    .delete().eq('id', fieldId)

  if (error) return { ok: false, error: error.message }
  return { ok: true }
}

export async function reorderFormFields(
  formId: string,
  fieldOrder: { id: string; sort_order: number }[]
): Promise<ActionResult> {
  await assertRole('admin')
  const supabase = createAdminClient()

  for (const item of fieldOrder) {
    await supabase.from('form_fields')
      .update({ sort_order: item.sort_order })
      .eq('id', item.id).eq('form_id', formId)
  }

  return { ok: true }
}

export async function duplicateForm(formId: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: original } = await supabase.from('forms')
    .select('*, form_fields(*), form_sections(*), form_submission_actions(*)')
    .eq('id', formId).eq('tenant_id', tenantId).single()

  if (!original) return { ok: false, error: 'Form not found' }

  const newSlug = original.slug + '-copy-' + Date.now().toString(36)
  const { data: newForm, error } = await supabase.from('forms').insert({
    tenant_id: tenantId,
    title: original.title + ' (Copy)',
    slug: newSlug,
    description: original.description,
    mode: original.mode,
    status: 'draft',
    access_control: original.access_control,
    theme_overrides: original.theme_overrides,
    header_config: original.header_config,
    footer_config: original.footer_config,
    background_config: original.background_config,
    custom_css: original.custom_css,
    thank_you_title: original.thank_you_title,
    thank_you_message: original.thank_you_message,
    created_by: actorId,
  }).select('id, slug').single()

  if (error || !newForm) return { ok: false, error: error?.message || 'Failed to duplicate' }

  if (original.form_sections?.length) {
    const sectionMap = new Map<string, string>()
    for (const sec of original.form_sections) {
      const { data: newSec } = await supabase.from('form_sections').insert({
        form_id: newForm.id,
        title: sec.title,
        description: sec.description,
        sort_order: sec.sort_order,
        page_number: sec.page_number,
        logic_rules: sec.logic_rules,
      }).select('id').single()
      if (newSec) sectionMap.set(sec.id, newSec.id)
    }

    if (original.form_fields?.length) {
      for (const field of original.form_fields) {
        await supabase.from('form_fields').insert({
          form_id: newForm.id,
          section_id: field.section_id ? sectionMap.get(field.section_id) ?? null : null,
          field_key: field.field_key,
          field_type: field.field_type,
          label: field.label,
          description: field.description,
          placeholder: field.placeholder,
          config: field.config,
          validation_rules: field.validation_rules,
          logic_rules: field.logic_rules,
          prefill_source: field.prefill_source,
          sort_order: field.sort_order,
          page_number: field.page_number,
          is_required: field.is_required,
        })
      }
    }
  }

  if (original.form_submission_actions?.length) {
    for (const action of original.form_submission_actions) {
      await supabase.from('form_submission_actions').insert({
        form_id: newForm.id,
        action_type: action.action_type,
        config: action.config,
        sort_order: action.sort_order,
        is_active: action.is_active,
      })
    }
  }

  return { ok: true, id: newForm.id, slug: newForm.slug }
}
