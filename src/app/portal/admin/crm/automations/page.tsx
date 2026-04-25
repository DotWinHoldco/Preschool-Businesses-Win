// @anchor: cca.crm.automations-list
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Plus, Sparkles, Zap } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CRM_EVENT_KINDS } from '@/lib/crm/events'
import { AUTOMATION_TEMPLATES } from '@/lib/crm/automation-templates'
import { AutomationToggle } from './automation-toggle'

export const dynamic = 'force-dynamic'

const KIND_LABEL = new Map(CRM_EVENT_KINDS.map((k) => [k.value, k.label] as const))

export default async function AutomationsPage() {
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)
  const { data: rows } = await supabase
    .from('crm_automations')
    .select(
      'id, name, description, trigger_kind, is_enabled, total_runs, last_run_at, template_key, created_at',
    )
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })

  const installedTemplateKeys = new Set(
    (rows ?? []).map((r) => r.template_key as string | null).filter(Boolean) as string[],
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Automations</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            React to events with email sends, tag changes, lifecycle moves, and more. Runs every
            minute.
          </p>
        </div>
        <Link href="/portal/admin/crm/automations/new">
          <Button>
            <Plus size={16} />
            New automation
          </Button>
        </Link>
      </div>

      {(rows ?? []).length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-3">
            <div className="h-12 w-12 mx-auto rounded-full bg-[var(--color-muted)] flex items-center justify-center">
              <Zap size={20} className="text-[var(--color-muted-foreground)]" />
            </div>
            <p className="font-semibold">No automations yet</p>
            <p className="text-sm text-[var(--color-muted-foreground)] max-w-md mx-auto">
              Pick a starter recipe below or build your own from scratch. Automations stay disabled
              until you turn them on.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(rows ?? []).map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex items-center justify-between gap-4">
                <Link href={`/portal/admin/crm/automations/${r.id}`} className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="font-semibold truncate">{r.name as string}</h2>
                    <Badge variant={r.is_enabled ? 'success' : 'secondary'}>
                      {r.is_enabled ? 'Live' : 'Paused'}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-[var(--color-muted-foreground)] flex-wrap">
                    <span>
                      Trigger: {KIND_LABEL.get(r.trigger_kind as never) ?? r.trigger_kind}
                    </span>
                    <span>·</span>
                    <span>{(r.total_runs as number).toLocaleString()} runs</span>
                    {r.last_run_at && (
                      <>
                        <span>·</span>
                        <span>Last fired {new Date(r.last_run_at as string).toLocaleString()}</span>
                      </>
                    )}
                  </div>
                  {r.description && (
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-1 line-clamp-1">
                      {r.description as string}
                    </p>
                  )}
                </Link>
                <AutomationToggle id={r.id as string} enabled={r.is_enabled as boolean} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[var(--color-primary)]" />
            <h2 className="font-semibold">Starter recipes</h2>
          </div>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            One-click, preschool-tuned automations. Each one starts paused so you can review the
            email template before turning it on.
          </p>
          <div className="grid sm:grid-cols-2 gap-2">
            {AUTOMATION_TEMPLATES.map((t) => {
              const installed = installedTemplateKeys.has(t.key)
              return (
                <Link
                  key={t.key}
                  href={`/portal/admin/crm/automations/new?template=${t.key}`}
                  className="block rounded-lg border border-[var(--color-border)] p-3 hover:border-[var(--color-primary)]/40 hover:bg-[var(--color-muted)]/30 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold">{t.name}</span>
                    {installed ? (
                      <Badge variant="outline">Installed</Badge>
                    ) : (
                      <Badge variant="secondary">{t.category}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-[var(--color-muted-foreground)]">{t.description}</p>
                  <p className="text-[11px] text-[var(--color-muted-foreground)] mt-1">
                    Trigger: {KIND_LABEL.get(t.trigger_kind) ?? t.trigger_kind}
                  </p>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
