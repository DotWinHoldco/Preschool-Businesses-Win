// @anchor: cca.portfolio.admin-page
// Admin portfolios overview — observations, learning stories, assessments.
// Server component: fetches real data, passes to client for interactivity.

import { headers } from 'next/headers'
import { notFound } from 'next/navigation'
import { createTenantAdminClient } from '@/lib/supabase/admin'
import { PortfoliosClient } from '@/components/portal/admin-portfolios-client'

export default async function AdminPortfoliosPage() {
  const headerStore = await headers()
  const tenantId = headerStore.get('x-tenant-id')
  if (!tenantId) notFound()

  const supabase = await createTenantAdminClient(tenantId)

  const { data: studentRows } = await supabase
    .from('students')
    .select('id, first_name, last_name')
    .eq('tenant_id', tenantId)
    .in('enrollment_status', ['active', 'enrolled'])
    .is('deleted_at', null)
    .order('first_name')

  const students = (studentRows ?? []).map((s) => ({
    id: s.id as string,
    name: `${s.first_name} ${s.last_name}`,
  }))

  const { data: domainRows } = await supabase
    .from('learning_domains')
    .select('id, framework, domain_name, subdomain_name, sort_order')
    .eq('tenant_id', tenantId)
    .order('framework')
    .order('domain_name')
    .order('sort_order')

  const domains = (domainRows ?? []).map((d) => ({
    id: d.id as string,
    framework: d.framework as string,
    domain_name: d.domain_name as string,
    subdomain_name: d.subdomain_name as string | null,
  }))

  const { data: entryRows } = await supabase
    .from('portfolio_entries')
    .select('id, student_id, entry_type, title, narrative, visibility, learning_domains, created_by, created_at, students!inner(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false })
    .limit(50)

  const entries = (entryRows ?? []).map((e) => {
    const student = e.students as unknown as { first_name: string; last_name: string }
    return {
      id: e.id as string,
      student_id: e.student_id as string,
      student_name: `${student.first_name} ${student.last_name}`,
      entry_type: e.entry_type as string,
      title: e.title as string,
      narrative: (e.narrative as string) ?? '',
      visibility: e.visibility as string,
      learning_domain_ids: (e.learning_domains as string[]) ?? [],
      created_at: e.created_at as string,
    }
  })

  const { count: observationCount } = await supabase
    .from('portfolio_entries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .in('entry_type', ['observation', 'work_sample', 'photo', 'video', 'milestone'])

  const { count: learningStoryCount } = await supabase
    .from('portfolio_entries')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .eq('entry_type', 'learning_story')

  const { data: studentsWithEntries } = await supabase
    .from('portfolio_entries')
    .select('student_id')
    .eq('tenant_id', tenantId)

  const uniqueStudentsWithPortfolios = new Set(
    (studentsWithEntries ?? []).map((r) => r.student_id)
  ).size

  const now = new Date()
  const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1).toISOString().slice(0, 10)

  const { data: completedAssessments } = await supabase
    .from('developmental_assessments')
    .select('student_id')
    .eq('tenant_id', tenantId)
    .eq('status', 'completed')
    .gte('assessment_period_start', quarterStart)

  const assessedStudentIds = new Set(
    (completedAssessments ?? []).map((a) => a.student_id)
  )
  const studentsNeedingAssessment = students.filter((s) => !assessedStudentIds.has(s.id))

  const stats = {
    observations: observationCount ?? 0,
    learningStories: learningStoryCount ?? 0,
    assessmentsDue: studentsNeedingAssessment.length,
    studentsWithPortfolios: uniqueStudentsWithPortfolios,
  }

  const quarterLabel = `Q${Math.floor(now.getMonth() / 3) + 1} ${now.getFullYear()}`
  const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0).toISOString().slice(0, 10)

  return (
    <PortfoliosClient
      students={students}
      domains={domains}
      entries={entries}
      stats={stats}
      quarterLabel={quarterLabel}
      quarterStart={quarterStart}
      quarterEnd={quarterEnd}
      studentsNeedingAssessment={studentsNeedingAssessment}
    />
  )
}
