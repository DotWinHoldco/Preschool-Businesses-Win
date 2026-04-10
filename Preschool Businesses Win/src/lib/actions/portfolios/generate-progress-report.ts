// @anchor: cca.portfolio.progress-report
'use server'

import { GenerateProgressReportSchema, type GenerateProgressReportInput } from '@/lib/schemas/portfolio'
import { createTenantServerClient } from '@/lib/supabase/server'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'

export type ProgressReportData = {
  student: { id: string; first_name: string; last_name: string; date_of_birth: string }
  period: { start: string; end: string }
  domains: Array<{
    domain_name: string
    subdomain_name: string | null
    framework: string
    rating: string
    evidence_notes: string | null
  }>
  portfolio_samples: Array<{
    id: string
    title: string
    entry_type: string
    narrative: string
    created_at: string
  }>
}

export type GenerateProgressReportState = {
  ok: boolean
  error?: string
  report?: ProgressReportData
}

export async function generateProgressReport(
  input: GenerateProgressReportInput
): Promise<GenerateProgressReportState> {
  const parsed = GenerateProgressReportSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Validation failed' }
  }

  const data = parsed.data
  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = await createTenantServerClient()

  // Fetch student
  const { data: student, error: studentError } = await supabase
    .from('students')
    .select('id, first_name, last_name, date_of_birth')
    .eq('id', data.student_id)
    .single()

  if (studentError || !student) {
    return { ok: false, error: 'Student not found' }
  }

  // Fetch assessment ratings for the period
  let assessmentQuery = supabase
    .from('assessment_ratings')
    .select(`
      rating,
      evidence_notes,
      learning_domain_id,
      learning_domains!inner(domain_name, subdomain_name, framework),
      developmental_assessments!inner(student_id, assessment_period_start, assessment_period_end)
    `)
    .eq('developmental_assessments.student_id', data.student_id)

  if (data.assessment_id) {
    assessmentQuery = assessmentQuery.eq('assessment_id', data.assessment_id)
  }

  const { data: ratings } = await assessmentQuery

  const domains = (ratings ?? []).map((r: Record<string, unknown>) => {
    const ld = r.learning_domains as Record<string, unknown> | null
    return {
      domain_name: (ld?.domain_name as string) ?? '',
      subdomain_name: (ld?.subdomain_name as string) ?? null,
      framework: (ld?.framework as string) ?? '',
      rating: r.rating as string,
      evidence_notes: r.evidence_notes as string | null,
    }
  })

  // Fetch portfolio samples in the period
  let portfolioSamples: Array<{
    id: string
    title: string
    entry_type: string
    narrative: string
    created_at: string
  }> = []

  if (data.include_portfolio_samples) {
    const { data: samples } = await supabase
      .from('portfolio_entries')
      .select('id, title, entry_type, narrative, created_at')
      .eq('student_id', data.student_id)
      .gte('created_at', data.period_start)
      .lte('created_at', data.period_end)
      .order('created_at', { ascending: true })
      .limit(20)

    portfolioSamples = (samples ?? []) as typeof portfolioSamples
  }

  // Audit
  await supabase.from('audit_log').insert({
    tenant_id: tenantId,
    actor_id: actorId,
    action: 'portfolio.progress_report.generated',
    entity_type: 'student',
    entity_id: data.student_id,
    after: { period_start: data.period_start, period_end: data.period_end },
  })

  return {
    ok: true,
    report: {
      student: student as ProgressReportData['student'],
      period: { start: data.period_start, end: data.period_end },
      domains,
      portfolio_samples: portfolioSamples,
    },
  }
}
