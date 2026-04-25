// @anchor: cca.crm.automations-detail
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { CRM_EVENT_KINDS } from '@/lib/crm/events'
import { AutomationBuilderClient } from '../automation-builder-client'
import { DeleteAutomationButton } from './delete-automation-button'

export const dynamic = 'force-dynamic'

const KIND_LABEL = new Map(CRM_EVENT_KINDS.map((k) => [k.value, k.label] as const))

export default async function AutomationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: auto } = await supabase
    .from('crm_automations')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!auto) notFound()

  const [
    { data: templates },
    { data: tags },
    { data: audiences },
    { data: campaigns },
    { data: runs },
  ] = await Promise.all([
    supabase
      .from('email_templates')
      .select('id, name, subject')
      .eq('tenant_id', tenantId)
      .order('name'),
    supabase
      .from('contact_tags')
      .select('id, label, color')
      .eq('tenant_id', tenantId)
      .order('label'),
    supabase.from('audiences').select('id, name, type').eq('tenant_id', tenantId).order('name'),
    supabase
      .from('email_campaigns')
      .select('id, name, type')
      .eq('tenant_id', tenantId)
      .eq('type', 'drip')
      .order('name'),
    supabase
      .from('crm_automation_runs')
      .select('id, status, contact_id, started_at, finished_at, step_results, error')
      .eq('automation_id', id)
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Link
            href="/portal/admin/crm/automations"
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{auto.name as string}</h1>
            <div className="flex items-center gap-2 mt-1 text-xs text-[var(--color-muted-foreground)]">
              <Badge variant={auto.is_enabled ? 'success' : 'secondary'}>
                {auto.is_enabled ? 'Live' : 'Paused'}
              </Badge>
              <span>·</span>
              <span>
                Trigger: {KIND_LABEL.get(auto.trigger_kind as never) ?? auto.trigger_kind}
              </span>
              <span>·</span>
              <span>{(auto.total_runs as number).toLocaleString()} runs</span>
            </div>
          </div>
        </div>
        <DeleteAutomationButton id={id} />
      </div>

      <AutomationBuilderClient
        templates={(templates ?? []) as { id: string; name: string; subject: string }[]}
        tags={(tags ?? []) as { id: string; label: string; color: string }[]}
        audiences={(audiences ?? []) as { id: string; name: string; type: string }[]}
        dripCampaigns={(campaigns ?? []) as { id: string; name: string }[]}
        initial={{
          id: auto.id as string,
          name: auto.name as string,
          description: (auto.description as string | null) ?? '',
          trigger_kind: auto.trigger_kind as string,
          conditions_json: (auto.conditions_json as { match: 'all' | 'any'; rules: unknown[] }) ?? {
            match: 'all',
            rules: [],
          },
          actions_json: (auto.actions_json as unknown[]) ?? [],
          is_enabled: auto.is_enabled as boolean,
          cooldown_minutes: auto.cooldown_minutes as number,
          max_runs_per_contact: (auto.max_runs_per_contact as number | null) ?? null,
        }}
      />

      <Card>
        <CardContent className="p-5">
          <h3 className="font-semibold text-sm mb-3">Recent runs</h3>
          {(runs ?? []).length === 0 ? (
            <p className="text-xs text-[var(--color-muted-foreground)]">
              No runs yet. Once the trigger event fires for a matching contact, runs will appear
              here.
            </p>
          ) : (
            <ol className="space-y-2 text-xs">
              {(runs ?? []).map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-md bg-[var(--color-muted)]/30"
                >
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        r.status === 'completed'
                          ? 'success'
                          : r.status === 'failed'
                            ? 'warning'
                            : r.status === 'skipped'
                              ? 'outline'
                              : 'secondary'
                      }
                    >
                      {r.status as string}
                    </Badge>
                    <span className="text-[var(--color-muted-foreground)]">
                      {r.started_at ? new Date(r.started_at as string).toLocaleString() : 'queued'}
                    </span>
                    {r.error && <span className="text-red-600">{r.error as string}</span>}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
