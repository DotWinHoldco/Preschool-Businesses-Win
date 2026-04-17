'use server'

// @anchor: platform.custom-fields.actions

import { CreateCustomFieldSchema, UpdateCustomFieldSchema, SetCustomFieldValueSchema } from '@/lib/schemas/custom-field'
import type { CreateCustomFieldInput, UpdateCustomFieldInput, SetCustomFieldValueInput } from '@/lib/schemas/custom-field'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'

type ActionResult = { ok: boolean; id?: string; error?: string; fieldErrors?: Record<string, string> }

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 60)
}

export async function createCustomField(input: CreateCustomFieldInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = CreateCustomFieldSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.join('.')
      if (key) fieldErrors[key] = issue.message
    }
    return { ok: false, error: 'Validation failed', fieldErrors }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const fieldKey = slugify(data.label)

  const { data: field, error } = await supabase.from('custom_fields').insert({
    tenant_id: tenantId,
    entity_type: data.entity_type,
    field_key: fieldKey,
    label: data.label,
    description: data.description,
    field_type: data.field_type,
    is_required: data.is_required,
    is_searchable: data.is_searchable,
    is_filterable: data.is_filterable,
    is_visible_to_parents: data.is_visible_to_parents,
    is_parent_editable: data.is_parent_editable,
    default_value: data.default_value ?? null,
    validation_rules: data.validation_rules,
    section_label: data.section_label,
    created_by: actorId,
  }).select('id').single()

  if (error) return { ok: false, error: error.message }

  if (data.options?.length && (data.field_type === 'select' || data.field_type === 'multi_select')) {
    const optionRows = data.options.map((opt, i) => ({
      custom_field_id: field.id,
      label: opt.label,
      value: opt.value,
      sort_order: i,
      color: opt.color ?? null,
      icon: opt.icon ?? null,
    }))
    await supabase.from('custom_field_options').insert(optionRows)
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'create',
    entity_type: 'custom_field',
    entity_id: field.id,
    after: data,
  })

  return { ok: true, id: field.id }
}

export async function updateCustomField(input: UpdateCustomFieldInput): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = UpdateCustomFieldSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const { id, options, ...updates } = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase.from('custom_fields')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  if (options) {
    await supabase.from('custom_field_options').delete().eq('custom_field_id', id)
    if (options.length) {
      const rows = options.map((opt, i) => ({
        custom_field_id: id,
        label: opt.label,
        value: opt.value,
        sort_order: i,
        color: opt.color ?? null,
        icon: opt.icon ?? null,
      }))
      await supabase.from('custom_field_options').insert(rows)
    }
  }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'update',
    entity_type: 'custom_field', entity_id: id, after: updates,
  })

  return { ok: true, id }
}

export async function deleteCustomField(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { error } = await supabase.from('custom_fields')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id).eq('tenant_id', tenantId)

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'soft_delete',
    entity_type: 'custom_field', entity_id: id,
  })

  return { ok: true }
}

export async function setCustomFieldValue(input: SetCustomFieldValueInput): Promise<ActionResult> {
  const parsed = SetCustomFieldValueSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()

  const { data: fieldDef } = await supabase.from('custom_fields')
    .select('field_type').eq('id', parsed.data.custom_field_id).single()
  if (!fieldDef) return { ok: false, error: 'Field not found' }

  const valueRow: Record<string, unknown> = {
    tenant_id: tenantId,
    custom_field_id: parsed.data.custom_field_id,
    entity_type: parsed.data.entity_type,
    entity_id: parsed.data.entity_id,
    value_text: null, value_numeric: null, value_boolean: null,
    value_date: null, value_json: null, value_file_path: null,
    updated_at: new Date().toISOString(),
  }

  const v = parsed.data.value
  switch (fieldDef.field_type) {
    case 'text': case 'textarea': case 'email': case 'phone':
    case 'url': case 'select': case 'color':
      valueRow.value_text = String(v ?? ''); break
    case 'number': case 'currency': case 'rating':
      valueRow.value_numeric = Number(v); break
    case 'boolean':
      valueRow.value_boolean = Boolean(v); break
    case 'date': case 'datetime':
      valueRow.value_date = String(v); break
    case 'multi_select': case 'json':
      valueRow.value_json = v; break
    case 'file': case 'image':
      valueRow.value_file_path = String(v ?? ''); break
  }

  const { error } = await supabase.from('custom_field_values')
    .upsert(valueRow, { onConflict: 'tenant_id,custom_field_id,entity_id' })

  if (error) return { ok: false, error: error.message }

  await supabase.from('audit_log').insert({
    tenant_id: tenantId, actor_id: actorId, action: 'set_custom_field_value',
    entity_type: parsed.data.entity_type, entity_id: parsed.data.entity_id,
    after: { field_id: parsed.data.custom_field_id, value: v },
  })

  return { ok: true }
}
