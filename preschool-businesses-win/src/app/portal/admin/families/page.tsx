// @anchor: cca.family.list-page
// Family list with search. Server Component.

import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'

const CCA_TENANT_ID = 'a0a0a0a0-cca0-4000-8000-000000000001'

export default async function FamiliesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q } = await searchParams
  const supabase = createAdminClient()

  let query = supabase
    .from('families')
    .select('id, family_name, billing_email, billing_phone, mailing_city, mailing_state, created_at')
    .eq('tenant_id', CCA_TENANT_ID)
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
        .eq('tenant_id', CCA_TENANT_ID)
        .in('family_id', familyIds)
    : { data: [] }

  const { data: studentLinks } = familyIds.length > 0
    ? await supabase
        .from('student_family_links')
        .select('family_id')
        .eq('tenant_id', CCA_TENANT_ID)
        .in('family_id', familyIds)
    : { data: [] }

  const memberCountMap = new Map<string, number>()
  for (const m of memberCounts ?? []) {
    memberCountMap.set(m.family_id, (memberCountMap.get(m.family_id) ?? 0) + 1)
  }

  const studentCountMap = new Map<string, number>()
  for (const s of studentLinks ?? []) {
    studentCountMap.set(s.family_id, (studentCountMap.get(s.family_id) ?? 0) + 1)
  }

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

      {/* Search */}
      <form method="get">
        <div className="relative max-w-md">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]"
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Search families..."
            className="h-10 w-full rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] pl-10 pr-4 text-sm text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
          />
        </div>
      </form>

      {/* Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Family</TableHead>
            <TableHead>Members</TableHead>
            <TableHead>Students</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Location</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(!families || families.length === 0) ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-[var(--color-muted-foreground)]">
                {q ? `No families matching "${q}"` : 'No families found'}
              </TableCell>
            </TableRow>
          ) : (
            families.map((family) => (
              <TableRow key={family.id}>
                <TableCell>
                  <Link
                    href={`/portal/admin/families/${family.id}`}
                    className="font-medium text-[var(--color-foreground)] hover:underline"
                  >
                    {family.family_name}
                  </Link>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">
                    {memberCountMap.get(family.id) ?? 0}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" size="sm">
                    {studentCountMap.get(family.id) ?? 0}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                  {family.billing_email || family.billing_phone || '—'}
                </TableCell>
                <TableCell className="text-sm text-[var(--color-muted-foreground)]">
                  {family.mailing_city && family.mailing_state
                    ? `${family.mailing_city}, ${family.mailing_state}`
                    : '—'}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
