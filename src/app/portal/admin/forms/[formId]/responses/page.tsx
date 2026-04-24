// @anchor: platform.form-builder.responses-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ResponseDetailDrawer } from '@/components/portal/forms/response-detail-drawer'

export default async function FormResponsesPage({
  params,
}: {
  params: Promise<{ formId: string }>
}) {
  const { formId } = await params
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: form } = await supabase.from('forms').select('id, title').eq('id', formId).single()
  if (!form) notFound()

  const [{ data: fields }, { data: responses }] = await Promise.all([
    supabase
      .from('form_fields')
      .select('id, field_key, label, sort_order')
      .eq('form_id', formId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('form_responses')
      .select('id, respondent_email, respondent_name, status, completed_at, created_at')
      .eq('form_id', formId)
      .order('created_at', { ascending: false })
      .limit(200),
  ])

  const respList = responses ?? []
  const respIds = respList.map((r) => r.id)

  const valuesByResponse: Record<string, Record<string, unknown>> = {}
  if (respIds.length > 0) {
    const { data: values } = await supabase
      .from('form_response_values')
      .select('response_id, field_id, value')
      .in('response_id', respIds)
    for (const v of values ?? []) {
      if (!valuesByResponse[v.response_id]) valuesByResponse[v.response_id] = {}
      valuesByResponse[v.response_id][v.field_id] = v.value
    }
  }

  const annotationsByResponse: Record<
    string,
    { response_id: string; status: string; notes: string | null } | null
  > = {}
  if (respIds.length > 0) {
    const { data: annos } = await supabase
      .from('form_response_annotations')
      .select('response_id, status, notes')
      .in('response_id', respIds)
    for (const a of annos ?? []) {
      annotationsByResponse[a.response_id] = {
        response_id: a.response_id,
        status: a.status,
        notes: a.notes,
      }
    }
  }

  const fieldMeta = (fields ?? []).map((f) => ({
    id: f.id as string,
    label: (f.label as string) ?? '',
    field_key: (f.field_key as string) ?? '',
  }))

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{form.title} — Responses</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--color-muted-foreground)' }}>
          {respList.length} total responses
        </p>
      </div>

      <ResponseDetailDrawer
        formId={formId}
        fields={fieldMeta}
        responses={respList}
        valuesByResponse={valuesByResponse}
        annotationsByResponse={annotationsByResponse}
      />
    </div>
  )
}
