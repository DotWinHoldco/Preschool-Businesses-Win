// @anchor: cca.crm.audience-detail
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Filter, Layout, Users, Send, RefreshCw } from 'lucide-react'
import { describeFilter } from '@/lib/crm/audience-filter'
import { AudienceMembersClient } from './audience-members-client'
import { AudienceRefreshButton } from './audience-refresh-button'
import { AudienceEditButton } from './audience-edit-button'
import { LIFECYCLE_LABELS, type LifecycleStage } from '@/lib/schemas/crm'

export const dynamic = 'force-dynamic'

export default async function AudienceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: audience } = await supabase
    .from('audiences')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!audience) notFound()

  const [{ data: members }, { data: tags }] = await Promise.all([
    supabase
      .from('audience_members')
      .select(
        'contact_id, source, kanban_column, added_at, contacts:contact_id(id, full_name, email, phone, lifecycle_stage)',
      )
      .eq('tenant_id', tenantId)
      .eq('audience_id', id)
      .order('added_at', { ascending: false })
      .limit(500),
    supabase.from('contact_tags').select('id, label').eq('tenant_id', tenantId),
  ])

  const tagLabels = new Map((tags ?? []).map((t) => [t.id as string, t.label as string]))
  const filterDesc = describeFilter(audience.filter_json as never, tagLabels)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/portal/admin/crm/audiences"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div className="flex items-start gap-3">
            <span
              className="h-12 w-12 rounded-xl flex items-center justify-center"
              style={{
                backgroundColor: (audience.color as string) + '20',
                color: audience.color as string,
              }}
            >
              {audience.kanban_enabled ? (
                <Layout size={20} />
              ) : audience.type === 'dynamic' ? (
                <Filter size={20} />
              ) : (
                <Users size={20} />
              )}
            </span>
            <div>
              <h1 className="text-2xl font-bold">{audience.name as string}</h1>
              <div className="flex items-center gap-2 mt-1 text-sm text-[var(--color-muted-foreground)]">
                <Badge variant={audience.type === 'dynamic' ? 'default' : 'secondary'}>
                  {audience.type === 'dynamic' ? 'Dynamic' : 'Static'}
                </Badge>
                <span>·</span>
                <span className="font-medium text-[var(--color-foreground)]">
                  {(audience.member_count as number).toLocaleString()} members
                </span>
              </div>
              {audience.description && (
                <p className="text-sm text-[var(--color-muted-foreground)] mt-2 max-w-2xl">
                  {audience.description as string}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {audience.type === 'dynamic' && <AudienceRefreshButton audienceId={id} />}
          {audience.kanban_enabled && (
            <Link href={`/portal/admin/crm/pipelines/${id}`}>
              <Button variant="secondary">
                <Layout size={14} />
                Open kanban
              </Button>
            </Link>
          )}
          <Link href={`/portal/admin/crm/campaigns/new?audience=${id}`}>
            <Button>
              <Send size={14} />
              Send campaign
            </Button>
          </Link>
          <AudienceEditButton audienceId={id} />
        </div>
      </div>

      {audience.type === 'dynamic' && (
        <Card>
          <CardContent className="p-4">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
              Rules
            </p>
            <p className="text-sm text-[var(--color-foreground)]">{filterDesc}</p>
            {audience.last_refreshed_at && (
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-2 inline-flex items-center gap-1">
                <RefreshCw size={10} />
                Last refreshed {new Date(audience.last_refreshed_at as string).toLocaleString()}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <AudienceMembersClient
        audienceId={id}
        audienceType={audience.type as 'static' | 'dynamic'}
        members={(members ?? []).map((m) => {
          const c = m.contacts as unknown as Record<string, unknown> | null
          return {
            contact_id: m.contact_id as string,
            source: m.source as string,
            added_at: m.added_at as string,
            kanban_column: (m.kanban_column as string | null) ?? null,
            full_name: (c?.full_name as string | null) ?? null,
            email: (c?.email as string | null) ?? null,
            phone: (c?.phone as string | null) ?? null,
            lifecycle_stage: ((c?.lifecycle_stage as LifecycleStage | undefined) ??
              'lead') as LifecycleStage,
          }
        })}
        lifecycleLabels={LIFECYCLE_LABELS}
      />
    </div>
  )
}
