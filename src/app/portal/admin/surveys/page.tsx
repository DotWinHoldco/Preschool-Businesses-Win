// @anchor: cca.survey.admin-page

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ClipboardList, Plus } from 'lucide-react'

const statusVariant: Record<string, 'success' | 'warning' | 'outline'> = {
  published: 'success',
  draft: 'warning',
  archived: 'outline',
}

const statusLabel: Record<string, string> = {
  published: 'Active',
  draft: 'Draft',
  archived: 'Closed',
}

export default async function AdminSurveysPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  let surveys: Array<{
    id: string
    title: string
    status: string
    created_at: string
    responseCount: number
  }> = []
  let fetchError = false

  try {
    const supabase = await createTenantAdminClient(tenantId)

    // Use the forms table — surveys are forms (we show all forms here as "surveys")
    const { data: forms } = await supabase
      .from('forms')
      .select('id, title, status, created_at')
      .order('created_at', { ascending: false })

    const { data: responseCounts } = await supabase
      .from('form_responses')
      .select('form_id')

    const countMap = new Map<string, number>()
    for (const r of responseCounts || []) {
      countMap.set(r.form_id, (countMap.get(r.form_id) || 0) + 1)
    }

    surveys = (forms || []).map((f) => ({
      id: f.id,
      title: f.title,
      status: f.status,
      created_at: f.created_at,
      responseCount: countMap.get(f.id) || 0,
    }))
  } catch {
    fetchError = true
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-foreground)' }}
          >
            Surveys
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            {surveys.length > 0
              ? `${surveys.length} survey${surveys.length !== 1 ? 's' : ''}`
              : 'Create and manage parent & staff surveys.'}
          </p>
        </div>
        <Link href="/portal/admin/surveys/new">
          <Button size="sm">
            <Plus size={16} />
            Create Survey
          </Button>
        </Link>
      </div>

      {/* Error fallback */}
      {fetchError && (
        <div
          className="text-center py-16 rounded-lg border"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-card)',
          }}
        >
          <ClipboardList
            size={40}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p
            className="text-sm"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Unable to load surveys. Please try again later.
          </p>
        </div>
      )}

      {/* Empty state */}
      {!fetchError && surveys.length === 0 && (
        <div
          className="text-center py-16 rounded-lg border"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-card)',
          }}
        >
          <ClipboardList
            size={40}
            className="mx-auto mb-3"
            style={{ color: 'var(--color-muted-foreground)' }}
          />
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--color-foreground)' }}
          >
            No surveys yet
          </p>
          <p
            className="text-sm mb-4"
            style={{ color: 'var(--color-muted-foreground)' }}
          >
            Gather feedback from parents and staff with custom surveys.
          </p>
          <Link href="/portal/admin/surveys/new">
            <Button>Create your first survey</Button>
          </Link>
        </div>
      )}

      {/* Survey list table */}
      {!fetchError && surveys.length > 0 && (
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            borderColor: 'var(--color-border)',
            backgroundColor: 'var(--color-card)',
          }}
        >
          {/* Table header */}
          <div
            className="hidden sm:grid grid-cols-[1fr_100px_100px_140px] gap-4 px-4 py-3 text-xs font-medium uppercase tracking-wide border-b"
            style={{
              color: 'var(--color-muted-foreground)',
              borderColor: 'var(--color-border)',
            }}
          >
            <span>Title</span>
            <span>Status</span>
            <span className="text-right">Responses</span>
            <span className="text-right">Created</span>
          </div>

          {/* Table rows */}
          <div
            className="divide-y"
            style={{ borderColor: 'var(--color-border)' }}
          >
            {surveys.map((survey) => (
              <Link
                key={survey.id}
                href={`/portal/admin/surveys/${survey.id}`}
                className="grid grid-cols-1 sm:grid-cols-[1fr_100px_100px_140px] gap-2 sm:gap-4 px-4 py-3 items-center transition-colors"
                style={{ color: 'var(--color-foreground)' }}
              >
                <div>
                  <p className="text-sm font-semibold">{survey.title}</p>
                  {/* Mobile-only inline badges */}
                  <div className="flex items-center gap-2 mt-1 sm:hidden">
                    <Badge
                      variant={statusVariant[survey.status] || 'outline'}
                    >
                      {statusLabel[survey.status] || survey.status}
                    </Badge>
                    <span
                      className="text-xs"
                      style={{ color: 'var(--color-muted-foreground)' }}
                    >
                      {survey.responseCount} response
                      {survey.responseCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
                <div className="hidden sm:block">
                  <Badge
                    variant={statusVariant[survey.status] || 'outline'}
                  >
                    {statusLabel[survey.status] || survey.status}
                  </Badge>
                </div>
                <span
                  className="hidden sm:block text-sm text-right tabular-nums"
                  style={{ color: 'var(--color-foreground)' }}
                >
                  {survey.responseCount}
                </span>
                <span
                  className="hidden sm:block text-sm text-right"
                  style={{ color: 'var(--color-muted-foreground)' }}
                >
                  {new Date(survey.created_at).toLocaleDateString()}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
