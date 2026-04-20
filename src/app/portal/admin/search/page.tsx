// @anchor: cca.admin.global-search
// Global search across students, families, and classrooms. Server Component.

import Link from 'next/link'
import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { Users, UserCircle, School, ChevronRight, Search } from 'lucide-react'

export default async function AdminSearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const { q } = await searchParams
  const query = q?.trim() || ''

  // If no query, show the empty prompt
  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--color-muted)]">
          <Search className="h-6 w-6 text-[var(--color-muted-foreground)]" />
        </div>
        <div className="text-center">
          <h1 className="text-xl font-semibold text-[var(--color-foreground)]">Search</h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Enter a name, email, or classroom to search across your center.
          </p>
        </div>
      </div>
    )
  }

  const supabase = await createTenantAdminClient(tenantId)

  // Run all three searches in parallel
  const [studentsResult, familiesResult, classroomsResult] = await Promise.all([
    supabase
      .from('students')
      .select('id, first_name, last_name, enrollment_status')
      .eq('tenant_id', tenantId)
      .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%`)
      .order('last_name', { ascending: true })
      .limit(10),
    supabase
      .from('families')
      .select('id, family_name, billing_email')
      .eq('tenant_id', tenantId)
      .or(`family_name.ilike.%${query}%,billing_email.ilike.%${query}%`)
      .order('family_name', { ascending: true })
      .limit(10),
    supabase
      .from('classrooms')
      .select('id, name, age_group')
      .eq('tenant_id', tenantId)
      .ilike('name', `%${query}%`)
      .order('name', { ascending: true })
      .limit(10),
  ])

  const students = studentsResult.data ?? []
  const families = familiesResult.data ?? []
  const classrooms = classroomsResult.data ?? []

  // Fetch classroom assignments for matched students
  const studentIds = students.map((s) => s.id)
  const { data: assignments } = studentIds.length > 0
    ? await supabase
        .from('student_classroom_assignments')
        .select('student_id, classroom_id, classrooms(name)')
        .eq('tenant_id', tenantId)
        .in('student_id', studentIds)
        .is('assigned_to', null)
    : { data: [] }

  const classroomMap = new Map<string, string>()
  for (const a of assignments ?? []) {
    const classroomName = (a as Record<string, unknown>).classrooms
      ? ((a as Record<string, unknown>).classrooms as { name: string }).name
      : null
    if (classroomName) classroomMap.set(a.student_id, classroomName)
  }

  const totalResults = students.length + families.length + classrooms.length

  if (totalResults === 0) {
    return (
      <div className="space-y-6">
        <SearchHeader query={query} />
        <div className="flex flex-col items-center justify-center gap-3 py-16">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-muted)]">
            <Search className="h-5 w-5 text-[var(--color-muted-foreground)]" />
          </div>
          <p className="text-sm text-[var(--color-muted-foreground)]">
            No results found for &ldquo;{query}&rdquo;
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <SearchHeader query={query} />

      <p className="text-sm text-[var(--color-muted-foreground)]">
        {totalResults} result{totalResults !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
      </p>

      {/* Students */}
      {students.length > 0 && (
        <ResultSection
          icon={<Users className="h-4 w-4" />}
          title="Students"
          count={students.length}
        >
          {students.map((student) => (
            <ResultRow
              key={student.id}
              href={`/portal/admin/students/${student.id}`}
              name={`${student.first_name} ${student.last_name}`}
              subtitle={classroomMap.get(student.id) ?? student.enrollment_status}
            />
          ))}
        </ResultSection>
      )}

      {/* Families */}
      {families.length > 0 && (
        <ResultSection
          icon={<UserCircle className="h-4 w-4" />}
          title="Families"
          count={families.length}
        >
          {families.map((family) => (
            <ResultRow
              key={family.id}
              href={`/portal/admin/families/${family.id}`}
              name={family.family_name}
              subtitle={family.billing_email ?? undefined}
            />
          ))}
        </ResultSection>
      )}

      {/* Classrooms */}
      {classrooms.length > 0 && (
        <ResultSection
          icon={<School className="h-4 w-4" />}
          title="Classrooms"
          count={classrooms.length}
        >
          {classrooms.map((classroom) => (
            <ResultRow
              key={classroom.id}
              href={`/portal/admin/classrooms/${classroom.id}`}
              name={classroom.name}
              subtitle={classroom.age_group ?? undefined}
            />
          ))}
        </ResultSection>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Sub-components (co-located, no 'use client' needed)
// ---------------------------------------------------------------------------

function SearchHeader({ query }: { query: string }) {
  return (
    <div>
      <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Search</h1>
      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
        Showing results for &ldquo;{query}&rdquo;
      </p>
    </div>
  )
}

function ResultSection({
  icon,
  title,
  count,
  children,
}: {
  icon: React.ReactNode
  title: string
  count: number
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-2 flex items-center gap-2 text-[var(--color-muted-foreground)]">
        {icon}
        <h2 className="text-xs font-semibold uppercase tracking-wider">
          {title}
        </h2>
        <span className="text-xs tabular-nums">({count})</span>
      </div>
      <ul className="divide-y divide-[var(--color-border)] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-card,var(--color-background))]">
        {children}
      </ul>
    </section>
  )
}

function ResultRow({
  href,
  name,
  subtitle,
}: {
  href: string
  name: string
  subtitle?: string
}) {
  return (
    <li>
      <Link
        href={href}
        className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-[var(--color-muted)]"
      >
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-[var(--color-foreground)]">
            {name}
          </p>
          {subtitle && (
            <p className="truncate text-xs text-[var(--color-muted-foreground)]">
              {subtitle}
            </p>
          )}
        </div>
        <ChevronRight className="h-4 w-4 shrink-0 text-[var(--color-muted-foreground)]" />
      </Link>
    </li>
  )
}
