'use server'

// @anchor: platform.forms.response-actions
// Response detail annotations, delete, and CSV export.

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { assertRole } from '@/lib/auth/session'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { writeAudit } from '@/lib/audit'

export type ActionResult = {
  ok: boolean
  error?: string
  id?: string
  csv?: string
  filename?: string
}

const AnnotationSchema = z.object({
  response_id: z.string().uuid(),
  status: z.enum(['open', 'follow_up', 'reviewed', 'archived']),
  notes: z.string().max(5000).optional().nullable(),
})

export async function setResponseAnnotation(
  response_id: string,
  input: { status: 'open' | 'follow_up' | 'reviewed' | 'archived'; notes?: string | null },
): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = AnnotationSchema.safeParse({ response_id, ...input })
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  // Verify the response belongs to this tenant (via the form).
  const { data: resp } = await supabase
    .from('form_responses')
    .select('id, form_id, forms!inner(tenant_id)')
    .eq('id', parsed.data.response_id)
    .single()

  if (
    !resp ||
    (resp as unknown as { forms: { tenant_id: string } }).forms?.tenant_id !== tenantId
  ) {
    return { ok: false, error: 'Response not found' }
  }

  // Upsert annotation. We don't rely on a unique index — look up existing.
  const { data: existing } = await supabase
    .from('form_response_annotations')
    .select('id')
    .eq('response_id', parsed.data.response_id)
    .eq('tenant_id', tenantId)
    .maybeSingle()

  if (existing?.id) {
    const { error } = await supabase
      .from('form_response_annotations')
      .update({
        status: parsed.data.status,
        notes: parsed.data.notes ?? null,
        reviewer_id: actorId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
    if (error) return { ok: false, error: error.message }
  } else {
    const { error } = await supabase.from('form_response_annotations').insert({
      tenant_id: tenantId,
      response_id: parsed.data.response_id,
      reviewer_id: actorId,
      status: parsed.data.status,
      notes: parsed.data.notes ?? null,
    })
    if (error) return { ok: false, error: error.message }
  }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'form.response.annotate',
    entityType: 'form_response',
    entityId: parsed.data.response_id,
    after: { status: parsed.data.status },
  })

  revalidatePath(`/portal/admin/forms/${resp.form_id}/responses`)
  return { ok: true, id: parsed.data.response_id }
}

export async function deleteResponse(id: string): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = z.string().uuid().safeParse(id)
  if (!parsed.success) return { ok: false, error: 'Invalid response id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: resp } = await supabase
    .from('form_responses')
    .select('id, form_id, forms!inner(tenant_id)')
    .eq('id', parsed.data)
    .single()

  if (
    !resp ||
    (resp as unknown as { forms: { tenant_id: string } }).forms?.tenant_id !== tenantId
  ) {
    return { ok: false, error: 'Response not found' }
  }

  await supabase.from('form_response_values').delete().eq('response_id', parsed.data)
  await supabase.from('form_response_annotations').delete().eq('response_id', parsed.data)
  const { error } = await supabase.from('form_responses').delete().eq('id', parsed.data)
  if (error) return { ok: false, error: error.message }

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'form.response.delete',
    entityType: 'form_response',
    entityId: parsed.data,
  })

  revalidatePath(`/portal/admin/forms/${resp.form_id}/responses`)
  return { ok: true, id: parsed.data }
}

function csvEscape(val: unknown): string {
  if (val === null || val === undefined) return ''
  const s = typeof val === 'string' ? val : JSON.stringify(val)
  if (/[",\n\r]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`
  }
  return s
}

export async function exportResponsesCSV(form_id: string): Promise<ActionResult> {
  await assertRole('admin')
  const parsed = z.string().uuid().safeParse(form_id)
  if (!parsed.success) return { ok: false, error: 'Invalid form id' }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: form } = await supabase
    .from('forms')
    .select('id, title, slug')
    .eq('id', parsed.data)
    .eq('tenant_id', tenantId)
    .single()
  if (!form) return { ok: false, error: 'Form not found' }

  const { data: fields } = await supabase
    .from('form_fields')
    .select('id, field_key, label, sort_order')
    .eq('form_id', parsed.data)
    .order('sort_order', { ascending: true })

  const fieldList = fields ?? []

  const { data: responses } = await supabase
    .from('form_responses')
    .select('id, respondent_email, respondent_name, status, completed_at, created_at')
    .eq('form_id', parsed.data)
    .order('created_at', { ascending: false })

  const respList = responses ?? []
  const respIds = respList.map((r) => r.id)

  const valueMap = new Map<string, Map<string, unknown>>()
  if (respIds.length > 0) {
    const { data: values } = await supabase
      .from('form_response_values')
      .select('response_id, field_id, value')
      .in('response_id', respIds)

    for (const v of values ?? []) {
      if (!valueMap.has(v.response_id)) valueMap.set(v.response_id, new Map())
      valueMap.get(v.response_id)!.set(v.field_id, v.value)
    }
  }

  const header = [
    'response_id',
    'submitted_at',
    'status',
    'respondent_name',
    'respondent_email',
    ...fieldList.map((f) => (f.label as string) || (f.field_key as string) || String(f.id)),
  ]

  const lines = [header.map(csvEscape).join(',')]
  for (const r of respList) {
    const vals = valueMap.get(r.id) ?? new Map()
    const row = [
      r.id,
      r.completed_at ?? r.created_at ?? '',
      r.status ?? '',
      r.respondent_name ?? '',
      r.respondent_email ?? '',
      ...fieldList.map((f) => vals.get(f.id as string) ?? ''),
    ]
    lines.push(row.map(csvEscape).join(','))
  }

  const csv = lines.join('\n')

  await writeAudit(supabase, {
    tenantId,
    actorId,
    action: 'form.responses.export_csv',
    entityType: 'form',
    entityId: parsed.data,
    after: { rows: respList.length },
  })

  return {
    ok: true,
    csv,
    filename: `${form.slug || form.id}-responses.csv`,
  }
}
