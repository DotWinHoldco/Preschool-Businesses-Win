// @anchor: cca.checklist.admin-page

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { ChecklistsAdminClient } from '@/components/portal/checklists/checklists-admin-client'

export default async function AdminChecklistsPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const [templatesRes, itemsRes, profilesRes] = await Promise.all([
    supabase
      .from('checklist_templates')
      .select('id, name, target_type, description, is_active, sort_order, created_at')
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('checklist_items')
      .select(
        'id, template_id, title, description, item_type, required, sort_order, deadline_days_from_assignment',
      )
      .eq('tenant_id', tenantId)
      .order('sort_order', { ascending: true }),
    supabase.from('user_profiles').select('id, full_name, role').eq('tenant_id', tenantId),
  ])

  const templates = (templatesRes.data ?? []).map((t) => ({
    id: t.id as string,
    name: (t.name as string) ?? '',
    target_type: (t.target_type as string) ?? 'daily',
    description: (t.description as string) ?? null,
    is_active: (t.is_active as boolean) ?? true,
    sort_order: (t.sort_order as number) ?? 0,
  }))

  const items = (itemsRes.data ?? []).map((i) => ({
    id: i.id as string,
    template_id: i.template_id as string,
    title: (i.title as string) ?? '',
    description: (i.description as string) ?? null,
    item_type: (i.item_type as string) ?? 'check',
    required: (i.required as boolean) ?? true,
    sort_order: (i.sort_order as number) ?? 0,
    deadline_days_from_assignment: (i.deadline_days_from_assignment as number) ?? null,
  }))

  const profiles = (profilesRes.data ?? []).map((p) => ({
    id: p.id as string,
    full_name: (p.full_name as string) ?? 'Unknown',
    role: (p.role as string) ?? '',
  }))

  return <ChecklistsAdminClient templates={templates} items={items} profiles={profiles} />
}
