'use server'

// @anchor: platform.form-builder.actions

import { CreateFormSchema, UpdateFormSchema, CreateFormFieldSchema } from '@/lib/schemas/form'
import type { CreateFormInput, UpdateFormInput, CreateFormFieldInput } from '@/lib/schemas/form'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

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
    entity_type: 'form', entity_id: form.id, after: parsed.data,
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
    entity_type: 'form', entity_id: id, after: updates,
  })

  return { ok: true, id }
}

export async function deleteForm(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

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
