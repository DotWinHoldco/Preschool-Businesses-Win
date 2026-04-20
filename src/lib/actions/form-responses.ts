'use server'

// @anchor: platform.form-builder.response-actions

import { SubmitFormResponseSchema } from '@/lib/schemas/form'
import type { SubmitFormResponseInput } from '@/lib/schemas/form'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'

type ActionResult = { ok: boolean; responseId?: string; error?: string }

export async function submitFormResponse(input: SubmitFormResponseInput): Promise<ActionResult> {
  const parsed = SubmitFormResponseSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: 'Validation failed' }

  const supabase = createAdminClient()
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  const { data: form } = await supabase.from('forms')
    .select('id, tenant_id, status')
    .eq('id', parsed.data.form_id)
    .single()

  if (!form || form.status !== 'published') {
    return { ok: false, error: 'Form not found or not published' }
  }

  const effectiveTenantId = tenantId || form.tenant_id

  const { data: response, error: respErr } = await supabase.from('form_responses').insert({
    tenant_id: effectiveTenantId,
    form_id: form.id,
    respondent_email: parsed.data.respondent_email,
    respondent_name: parsed.data.respondent_name,
    status: 'completed',
    ip_address: headerStore.get('x-forwarded-for') || headerStore.get('x-real-ip'),
    user_agent: headerStore.get('user-agent'),
    completed_at: new Date().toISOString(),
  }).select('id').single()

  if (respErr || !response) return { ok: false, error: respErr?.message || 'Failed to create response' }

  const { data: fields } = await supabase.from('form_fields')
    .select('id, field_key, field_type')
    .eq('form_id', form.id)
    .order('sort_order')

  if (fields?.length) {
    const valueRows = fields
      .filter(f => parsed.data.values[f.field_key] !== undefined)
      .map(f => {
        const v = parsed.data.values[f.field_key]
        const row: Record<string, unknown> = {
          response_id: response.id,
          field_id: f.id,
          value_text: null, value_numeric: null, value_boolean: null,
          value_date: null, value_json: null, value_file_path: null,
          signature_data: null,
        }

        switch (f.field_type) {
          case 'short_text': case 'long_text': case 'rich_text':
          case 'email': case 'phone': case 'url': case 'address_autocomplete':
          case 'single_select_dropdown': case 'single_select_radio':
          case 'button_group': case 'hidden_field':
            row.value_text = String(v ?? ''); break
          case 'number': case 'currency': case 'rating':
          case 'opinion_scale': case 'nps': case 'slider':
          case 'calculator': case 'payment_stripe':
            row.value_numeric = Number(v); break
          case 'yes_no': case 'legal_acceptance':
            row.value_boolean = Boolean(v); break
          case 'date': case 'time': case 'datetime':
            row.value_date = String(v); break
          case 'multi_select_checkbox': case 'image_choice':
          case 'matrix_grid': case 'ranking': case 'date_range':
          case 'dynamic_select': case 'repeater_group':
            row.value_json = v; break
          case 'file_upload': case 'image_upload':
            row.value_file_path = String(v ?? ''); break
          case 'signature_pad':
            row.signature_data = v; break
          default:
            row.value_text = v != null ? String(v) : null
        }
        return row
      })

    if (valueRows.length) {
      await supabase.from('form_response_values').insert(valueRows)
    }
  }

  if (parsed.data.draft_token) {
    await supabase.from('form_response_drafts')
      .delete().eq('resume_token', parsed.data.draft_token)
  }

  await supabase.from('audit_log').insert({
    tenant_id: effectiveTenantId,
    action: 'form_response_submitted',
    entity_type: 'form_response',
    entity_id: response.id,
    after_data: { form_id: form.id, respondent_email: parsed.data.respondent_email },
  })

  return { ok: true, responseId: response.id }
}

export async function saveDraft(
  formId: string,
  draftData: Record<string, unknown>,
  currentStep: number,
  resumeToken?: string
): Promise<{ ok: boolean; token?: string; error?: string }> {
  const supabase = createAdminClient()
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')

  const { data: form } = await supabase.from('forms')
    .select('tenant_id').eq('id', formId).single()
  if (!form) return { ok: false, error: 'Form not found' }

  const effectiveTenantId = tenantId || form.tenant_id
  const token = resumeToken || crypto.randomUUID()

  await supabase.from('form_response_drafts').upsert({
    tenant_id: effectiveTenantId,
    form_id: formId,
    resume_token: token,
    draft_data: draftData,
    current_step: currentStep,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  }, { onConflict: 'resume_token' })

  return { ok: true, token }
}
