// @anchor: cca.subsidy.admin-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { SubsidyEnrollment } from '@/components/portal/subsidies/subsidy-enrollment'
import { SubsidyActions } from '@/components/portal/subsidies/subsidy-actions'

export default async function SubsidiesPage() {
  const supabase = await createTenantServerClient()

  const { data: subsidies } = await supabase
    .from('family_subsidies')
    .select(`
      *,
      students(first_name, last_name),
      families(family_name),
      subsidy_agencies(name)
    `)
    .order('authorization_end', { ascending: true })

  const mapped = (subsidies ?? []).map((s: Record<string, unknown>) => {
    const student = s.students as Record<string, unknown> | null
    const family = s.families as Record<string, unknown> | null
    const agency = s.subsidy_agencies as Record<string, unknown> | null
    return {
      id: s.id as string,
      student_name: student ? `${student.first_name} ${student.last_name}` : 'Unknown',
      family_name: (family?.family_name as string) ?? 'Unknown',
      agency_name: (agency?.name as string) ?? 'Unknown',
      case_number: s.case_number as string,
      authorization_start: s.authorization_start as string,
      authorization_end: s.authorization_end as string,
      authorized_days_per_week: (s.authorized_days_per_week as number) ?? 5,
      authorized_hours_per_day: (s.authorized_hours_per_day as number) ?? 8,
      subsidy_rate_cents_per_day: (s.subsidy_rate_cents_per_day as number) ?? 0,
      family_copay_cents_per_week: (s.family_copay_cents_per_week as number) ?? 0,
      status: (s.status as string) ?? 'active',
    }
  })

  return (
    <div className="space-y-6">
      <SubsidyActions />
      <SubsidyEnrollment subsidies={mapped} />
    </div>
  )
}
