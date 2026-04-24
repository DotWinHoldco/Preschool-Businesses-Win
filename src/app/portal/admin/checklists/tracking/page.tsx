// @anchor: cca.checklist.tracking-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ChecklistTrackingClient } from '@/components/portal/checklists/checklist-tracking-client'

interface SearchParams {
  template?: string
  assignee?: string
  status?: string
  from?: string
  to?: string
  run?: string
}

export default async function ChecklistTrackingPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const sp = await searchParams
  const supabase = await createTenantAdminClient(tenantId)

  // Fetch templates + profiles + runs + run_items
  const [templatesRes, profilesRes] = await Promise.all([
    supabase.from('checklist_templates').select('id, name').eq('tenant_id', tenantId).order('name'),
    supabase.from('user_profiles').select('id, full_name').eq('tenant_id', tenantId),
  ])

  let runsQuery = supabase
    .from('checklist_runs')
    .select(
      'id, template_id, assigned_to, assigned_date, due_date, status, completed_at, target_entity_type, target_entity_id, notes',
    )
    .eq('tenant_id', tenantId)
    .order('assigned_date', { ascending: false })

  if (sp.template) runsQuery = runsQuery.eq('template_id', sp.template)
  if (sp.assignee) runsQuery = runsQuery.eq('assigned_to', sp.assignee)
  if (sp.status) runsQuery = runsQuery.eq('status', sp.status)
  if (sp.from) runsQuery = runsQuery.gte('assigned_date', sp.from)
  if (sp.to) runsQuery = runsQuery.lte('assigned_date', sp.to)

  const runsRes = await runsQuery

  const runs = (runsRes.data ?? []).map((r) => ({
    id: r.id as string,
    template_id: r.template_id as string,
    assigned_to: (r.assigned_to as string) ?? null,
    assigned_date: (r.assigned_date as string) ?? '',
    due_date: (r.due_date as string) ?? null,
    status: (r.status as string) ?? 'pending',
    completed_at: (r.completed_at as string) ?? null,
    notes: (r.notes as string) ?? null,
  }))

  const runIds = runs.map((r) => r.id)
  const runItemsRes =
    runIds.length > 0
      ? await supabase
          .from('checklist_run_items')
          .select('id, run_id, item_id, is_checked, checked_at, notes, photo_path')
          .eq('tenant_id', tenantId)
          .in('run_id', runIds)
      : { data: [] as unknown[], error: null }

  const runItems = ((runItemsRes.data ?? []) as Record<string, unknown>[]).map((ri) => ({
    id: ri.id as string,
    run_id: ri.run_id as string,
    item_id: ri.item_id as string,
    is_checked: (ri.is_checked as boolean) ?? false,
    checked_at: (ri.checked_at as string) ?? null,
    notes: (ri.notes as string) ?? null,
    photo_path: (ri.photo_path as string) ?? null,
  }))

  // Fetch item metadata for the templates that have runs, for detail view
  const templateIds = [...new Set(runs.map((r) => r.template_id))]
  const itemsRes =
    templateIds.length > 0
      ? await supabase
          .from('checklist_items')
          .select('id, template_id, title, item_type, required, sort_order')
          .eq('tenant_id', tenantId)
          .in('template_id', templateIds)
          .order('sort_order')
      : { data: [] as unknown[], error: null }

  const items = ((itemsRes.data ?? []) as Record<string, unknown>[]).map((i) => ({
    id: i.id as string,
    template_id: i.template_id as string,
    title: (i.title as string) ?? '',
    item_type: (i.item_type as string) ?? 'check',
    required: (i.required as boolean) ?? true,
    sort_order: (i.sort_order as number) ?? 0,
  }))

  const templates = (templatesRes.data ?? []).map((t) => ({
    id: t.id as string,
    name: (t.name as string) ?? '',
  }))
  const profiles = (profilesRes.data ?? []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) ?? 'Unknown',
  }))

  return (
    <ChecklistTrackingClient
      runs={runs}
      runItems={runItems}
      items={items}
      templates={templates}
      profiles={profiles}
      filters={sp}
    />
  )
}
