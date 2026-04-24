// @anchor: cca.survey.detail-page

import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { SurveyDetailActions } from '@/components/portal/surveys/survey-detail-actions'

export const metadata: Metadata = {
  title: 'Survey Detail | Admin Portal',
  description: 'View survey details, responses, and analytics',
}

export default async function AdminSurveyDetailPage({
  params,
}: {
  params: Promise<{ surveyId: string }>
}) {
  const { surveyId } = await params

  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch the form (survey)
  const { data: form } = await supabase
    .from('forms')
    .select('*')
    .eq('tenant_id', tenantId)
    .eq('id', surveyId)
    .single()

  if (!form) notFound()

  // Fetch fields and responses in parallel
  const [fieldsRes, responsesRes] = await Promise.all([
    supabase
      .from('form_fields')
      .select('id, label, field_type, sort_order, options, is_required')
      .eq('form_id', surveyId)
      .order('sort_order', { ascending: true }),
    supabase.from('form_responses').select('id, created_at').eq('form_id', surveyId),
  ])

  const fields = fieldsRes.data ?? []
  const responses = responsesRes.data ?? []
  const totalResponses = responses.length

  // Fetch response values for all responses
  const responseIds = responses.map((r) => r.id)
  let responseValues: Array<{ response_id: string; field_id: string; value: string }> = []
  if (responseIds.length > 0) {
    const { data: vals } = await supabase
      .from('form_response_values')
      .select('response_id, field_id, value')
      .in('response_id', responseIds)
    responseValues = vals ?? []
  }

  // Compute per-field averages for numeric/rating fields
  const fieldSummaries = fields.map((field) => {
    const fieldVals = responseValues.filter((v) => v.field_id === field.id)
    const numericVals = fieldVals.map((v) => parseFloat(v.value)).filter((n) => !isNaN(n))
    const avg =
      numericVals.length > 0
        ? (numericVals.reduce((s, n) => s + n, 0) / numericVals.length).toFixed(1)
        : null
    return {
      ...field,
      avgRating: avg,
      responseCount: fieldVals.length,
    }
  })

  const isActive = form.status === 'active' || form.status === 'published'

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
            {form.title ?? 'Untitled Survey'}
          </h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            {form.description ?? 'No description'}
          </p>
        </div>
        <div className="flex gap-2">
          <span
            className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
            style={{
              backgroundColor: isActive ? 'var(--color-primary)' : 'var(--color-muted)',
              color: isActive ? 'var(--color-primary-foreground)' : 'var(--color-muted-foreground)',
            }}
          >
            {isActive ? 'Active' : (form.status ?? 'Draft')}
          </span>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[
          { label: 'Total Responses', value: totalResponses.toString() },
          { label: 'Questions', value: fields.length.toString() },
          { label: 'Status', value: form.status ?? 'Draft' },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-xs font-medium" style={{ color: 'var(--color-muted-foreground)' }}>
              {stat.label}
            </p>
            <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--color-foreground)' }}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Questions + results */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-foreground)' }}>
          Question Results
        </h2>
        {fieldSummaries.length === 0 ? (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              backgroundColor: 'var(--color-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
              No questions defined for this survey.
            </p>
          </div>
        ) : (
          fieldSummaries.map((q, i) => (
            <div
              key={q.id}
              className="rounded-xl p-4"
              style={{
                backgroundColor: 'var(--color-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-foreground)' }}>
                    {i + 1}. {q.label}
                  </p>
                  <p className="mt-1 text-xs" style={{ color: 'var(--color-muted-foreground)' }}>
                    Type: {(q.field_type ?? 'text').replace(/_/g, ' ')} &middot; {q.responseCount}{' '}
                    responses
                  </p>
                </div>
                {q.avgRating !== null && (
                  <span className="text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                    {q.avgRating}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Empty state for responses */}
      {totalResponses === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ backgroundColor: 'var(--color-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--color-muted-foreground)' }}>
            No responses yet.
          </p>
        </div>
      )}

      {/* Actions */}
      <SurveyDetailActions surveyId={surveyId} isArchived={form.status === 'archived'} />
    </div>
  )
}
