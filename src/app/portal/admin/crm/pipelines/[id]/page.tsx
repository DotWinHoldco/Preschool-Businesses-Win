// @anchor: cca.crm.kanban-pipeline
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { KanbanClient } from './kanban-client'
import { LIFECYCLE_LABELS, LIFECYCLE_COLORS, type LifecycleStage } from '@/lib/schemas/crm'

export const dynamic = 'force-dynamic'

export default async function PipelinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const { data: audience } = await supabase
    .from('audiences')
    .select('id, name, kanban_enabled, kanban_columns, color')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .maybeSingle()
  if (!audience || !audience.kanban_enabled) notFound()

  const { data: members } = await supabase
    .from('audience_members')
    .select('contact_id, kanban_column, contacts:contact_id(id, full_name, email, lifecycle_stage)')
    .eq('tenant_id', tenantId)
    .eq('audience_id', id)
    .limit(2000)

  const cards = (members ?? []).map((m) => {
    const c = m.contacts as unknown as Record<string, unknown> | null
    return {
      contact_id: m.contact_id as string,
      column:
        (m.kanban_column as string | null) ??
        (audience.kanban_columns as string[])[0] ??
        'Unsorted',
      full_name: (c?.full_name as string | null) ?? null,
      email: (c?.email as string | null) ?? null,
      lifecycle_stage: ((c?.lifecycle_stage as LifecycleStage | undefined) ??
        'lead') as LifecycleStage,
    }
  })

  return (
    <div className="space-y-4 h-[calc(100vh-7rem)] flex flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href={`/portal/admin/crm/audiences/${id}`}
            className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{audience.name as string}</h1>
            <p className="text-sm text-[var(--color-muted-foreground)]">
              {cards.length.toLocaleString()} contacts on the board · drag cards between columns
            </p>
          </div>
        </div>
      </div>
      <KanbanClient
        audienceId={id}
        columns={audience.kanban_columns as string[]}
        cards={cards}
        accentColor={audience.color as string}
        lifecycleLabels={LIFECYCLE_LABELS}
        lifecycleColors={LIFECYCLE_COLORS}
      />
    </div>
  )
}
