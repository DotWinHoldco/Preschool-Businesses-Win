// @anchor: cca.family.list-page
// Family list with search. Server Component — data fetched server-side,
// client-side filter via FamilyListClient.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Button } from '@/components/ui/button'
import { FamilyListClient } from '@/components/portal/families/family-list-client'

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { q } = await searchParams
  const supabase = await createTenantAdminClient(tenantId)

  let query = supabase
    .from('families')
    .select('id, family_name, billing_email, billing_phone, mailing_city, mailing_state, created_at')
    .eq('tenant_id', tenantId)
    .order('family_name', { ascending: true })
    .limit(100)

  if (q) {
    query = query.or(`family_name.ilike.%${q}%,billing_email.ilike.%${q}%`)
  }

  const { data: families } = await query

  // Fetch member counts and student counts for each family
  const familyIds = families?.map((f) => f.id) ?? []

  const { data: memberCounts } = familyIds.length > 0
    ? await supabase
        .from('family_members')
        .select('family_id')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
    : { data: [] }

  const { data: studentLinks } = familyIds.length > 0
    ? await supabase
        .from('student_family_links')
        .select('family_id')
        .eq('tenant_id', tenantId)
        .in('family_id', familyIds)
    : { data: [] }

  // Serialize count maps as plain objects for client component
  const memberCountMap: Record<string, number> = {}
  for (const m of memberCounts ?? []) {
    memberCountMap[m.family_id] = (memberCountMap[m.family_id] ?? 0) + 1
  }

  const studentCountMap: Record<string, number> = {}
  for (const s of studentLinks ?? []) {
    studentCountMap[s.family_id] = (studentCountMap[s.family_id] ?? 0) + 1
  }

  // Serialize families for client component
  const serializedFamilies = (families ?? []).map((f) => ({
    id: f.id,
    family_name: f.family_name,
    billing_email: f.billing_email,
    billing_phone: f.billing_phone,
    mailing_city: f.mailing_city,
    mailing_state: f.mailing_state,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Families</h1>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            {families?.length ?? 0} famil{(families?.length ?? 0) !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <Button asChild>
          <Link href="/portal/admin/families/new">Add Family</Link>
        </Button>
      </div>

      {/* Client-side filter + table */}
      <FamilyListClient
        families={serializedFamilies}
        memberCountMap={memberCountMap}
        studentCountMap={studentCountMap}
        serverQuery={q}
      />
    </div>
  )
}
