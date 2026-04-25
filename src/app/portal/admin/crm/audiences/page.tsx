// @anchor: cca.crm.audiences-list
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Users, Filter, Layout } from 'lucide-react'
import { AudiencesListActions } from './audiences-list-actions'

export const dynamic = 'force-dynamic'

export default async function AudiencesPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: audiences } = await supabase
    .from('audiences')
    .select(
      'id, name, description, type, color, kanban_enabled, kanban_columns, member_count, last_refreshed_at, created_at',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Audiences</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Saved segments of contacts. Use them to send targeted campaigns or build a kanban
            pipeline.
          </p>
        </div>
        <Link href="/portal/admin/crm/audiences/new">
          <Button>
            <Plus size={16} />
            New audience
          </Button>
        </Link>
      </div>

      {(audiences ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Users size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold">No audiences yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto">
              Create a static list (hand-pick contacts) or a dynamic segment (rules that auto-update
              as contacts change). Mark any audience as a kanban to drag contacts between stages.
            </p>
            <Link href="/portal/admin/crm/audiences/new">
              <Button>
                <Plus size={16} />
                Create your first audience
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {(audiences ?? []).map((a) => (
            <Card key={a.id} className="group hover:shadow-md transition-shadow">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/portal/admin/crm/audiences/${a.id}`}
                    className="flex-1 min-w-0 space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: a.color as string }}
                      />
                      <h2 className="font-semibold text-[var(--color-foreground)] truncate group-hover:text-[var(--color-primary)] transition-colors">
                        {a.name as string}
                      </h2>
                    </div>
                    {a.description && (
                      <p className="text-xs text-[var(--color-muted-foreground)] line-clamp-2">
                        {a.description as string}
                      </p>
                    )}
                  </Link>
                  <AudiencesListActions audienceId={a.id as string} name={a.name as string} />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-muted)] px-2 py-0.5 text-[var(--color-muted-foreground)]">
                    {a.type === 'dynamic' ? <Filter size={11} /> : <Users size={11} />}
                    {a.type === 'dynamic' ? 'Dynamic' : 'Static'}
                  </span>
                  {a.kanban_enabled && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[var(--color-primary)] font-medium">
                      <Layout size={11} />
                      Kanban
                    </span>
                  )}
                  <span className="ml-auto font-semibold text-[var(--color-foreground)]">
                    {(a.member_count as number).toLocaleString()} member
                    {a.member_count === 1 ? '' : 's'}
                  </span>
                </div>
                {a.kanban_enabled && (
                  <Link
                    href={`/portal/admin/crm/pipelines/${a.id}`}
                    className="block text-center text-xs font-medium text-[var(--color-primary)] hover:underline pt-1 border-t border-[var(--color-border)]"
                  >
                    Open kanban →
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
