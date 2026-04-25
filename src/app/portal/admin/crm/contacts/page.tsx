// @anchor: cca.crm.contacts-list
// Unified contact list. Replaces the old /portal/admin/leads as the
// canonical CRM entry point — leads, applicants, parents, alumni, and staff
// all live here under a single contact_id.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { LIFECYCLE_STAGES } from '@/lib/schemas/crm'
import { ContactsPageClient, type ContactRow, type TagRow } from './contacts-page-client'

export const dynamic = 'force-dynamic'

interface SearchParams {
  q?: string
  stage?: string
  source?: string
  tag?: string
  page?: string
}

const PAGE_SIZE = 50

export default async function ContactsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const h = await headers()
  const tenantId = h.get('x-tenant-id')
  if (!tenantId) notFound()
  const supabase = await createTenantAdminClient(tenantId)

  const page = Math.max(1, parseInt(sp.page ?? '1', 10) || 1)
  const offset = (page - 1) * PAGE_SIZE

  let query = supabase
    .from('contacts')
    .select(
      'id, email, phone, first_name, last_name, full_name, lifecycle_stage, source, source_detail, owner_user_id, last_activity_at, created_at, primary_lead_id, primary_application_id, family_id, staff_user_id',
      { count: 'exact' },
    )
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  if (sp.q && sp.q.trim().length > 0) {
    const q = sp.q.trim().toLowerCase()
    query = query.or(
      `email.ilike.%${q}%,phone.ilike.%${q}%,full_name.ilike.%${q}%,first_name.ilike.%${q}%,last_name.ilike.%${q}%`,
    )
  }
  if (sp.stage && (LIFECYCLE_STAGES as readonly string[]).includes(sp.stage)) {
    query = query.eq('lifecycle_stage', sp.stage)
  }
  if (sp.source) {
    query = query.eq('source', sp.source)
  }

  query = query
    .order('last_activity_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  const [{ data: contacts, count }, { data: tagsAll }, { data: assignmentsAll }] =
    await Promise.all([
      query,
      supabase
        .from('contact_tags')
        .select('id, slug, label, color, description, is_system')
        .eq('tenant_id', tenantId)
        .order('label'),
      supabase
        .from('contact_tag_assignments')
        .select('contact_id, tag_id')
        .eq('tenant_id', tenantId),
    ])

  // Tag-filter applied in JS so the SQL stays simple. For very large tenants
  // we'd push this to a join + ANY().
  const tagFilter = sp.tag ?? null
  const assignmentsByContact = new Map<string, string[]>()
  for (const a of assignmentsAll ?? []) {
    const cid = a.contact_id as string
    const tid = a.tag_id as string
    if (!assignmentsByContact.has(cid)) assignmentsByContact.set(cid, [])
    assignmentsByContact.get(cid)!.push(tid)
  }

  let rows: ContactRow[] = (contacts ?? []).map((c) => ({
    id: c.id as string,
    email: (c.email as string | null) ?? null,
    phone: (c.phone as string | null) ?? null,
    full_name: (c.full_name as string | null) ?? null,
    first_name: (c.first_name as string | null) ?? null,
    last_name: (c.last_name as string | null) ?? null,
    lifecycle_stage: c.lifecycle_stage as ContactRow['lifecycle_stage'],
    source: c.source as ContactRow['source'],
    source_detail: (c.source_detail as string | null) ?? null,
    owner_user_id: (c.owner_user_id as string | null) ?? null,
    last_activity_at: c.last_activity_at as string,
    created_at: c.created_at as string,
    has_lead: !!c.primary_lead_id,
    has_application: !!c.primary_application_id,
    has_family: !!c.family_id,
    is_staff: !!c.staff_user_id,
    tag_ids: assignmentsByContact.get(c.id as string) ?? [],
  }))

  if (tagFilter) {
    rows = rows.filter((r) => r.tag_ids.includes(tagFilter))
  }

  const tags: TagRow[] = (tagsAll ?? []).map((t) => ({
    id: t.id as string,
    slug: t.slug as string,
    label: t.label as string,
    color: (t.color as string) ?? '#3b70b0',
    description: (t.description as string | null) ?? null,
    is_system: (t.is_system as boolean) ?? false,
  }))

  return (
    <ContactsPageClient
      contacts={rows}
      tags={tags}
      total={count ?? rows.length}
      page={page}
      pageSize={PAGE_SIZE}
      filters={{ q: sp.q ?? '', stage: sp.stage ?? '', source: sp.source ?? '', tag: sp.tag ?? '' }}
    />
  )
}
