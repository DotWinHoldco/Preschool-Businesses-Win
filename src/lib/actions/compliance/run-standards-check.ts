'use server'

// @anchor: cca.compliance.run-check
// Run compliance standards check against Texas DFPS Chapter 746
// See CCA_BUILD_BRIEF.md §39

import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { getTenantId, getActorId } from '@/lib/actions/get-tenant-id'
import { assertRole } from '@/lib/auth/session'
import { writeAudit } from '@/lib/audit'

const RunStandardsCheckSchema = z.object({
  standard_id: z.string().uuid(),
  status: z.enum(['compliant', 'non_compliant', 'needs_attention', 'not_applicable']),
  evidence_notes: z.string().max(2000).optional(),
  corrective_action: z.string().max(2000).optional(),
})

export async function runStandardsCheck(input: z.infer<typeof RunStandardsCheckSchema>) {
  await assertRole('admin')

  const parsed = RunStandardsCheckSchema.safeParse(input)
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.flatten().fieldErrors }
  }

  const tenantId = await getTenantId()
  const actorId = await getActorId()
  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('compliance_checks')
    .insert({
      tenant_id: tenantId,
      standard_id: parsed.data.standard_id,
      checked_by: actorId,
      checked_at: now,
      status: parsed.data.status,
      evidence_notes: parsed.data.evidence_notes ?? null,
      corrective_action: parsed.data.corrective_action ?? null,
    })
    .select('id')
    .single()

  if (error) {
    return { ok: false as const, error: { _form: [error.message] } }
  }

  await writeAudit(supabase, {
    tenantId: tenantId,
    actorId: actorId,
    action: 'compliance.standards_check',
    entityType: 'compliance_check',
    entityId: data.id as string,
    after: { standard_id: parsed.data.standard_id, status: parsed.data.status },
  })

  return { ok: true as const, checkId: data.id as string }
}

/**
 * Run a full ratio compliance check for all classrooms.
 * Uses Texas DFPS Chapter 746 age-specific ratio tables.
 */
export async function runRatioComplianceCheck() {
  await assertRole('admin')

  const tenantId = await getTenantId()
  const supabase = createAdminClient()
  const now = new Date().toISOString()
  const today = now.split('T')[0]

  // Get all active classrooms
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, name, age_range_min_months, age_range_max_months')
    .eq('tenant_id', tenantId)
    .eq('status', 'active')

  if (!classrooms || classrooms.length === 0) {
    return { ok: true as const, results: [] }
  }

  // Get DFPS ratio requirements
  const { data: ratioReqs } = await supabase
    .from('dfps_ratio_requirements')
    .select('*')
    .order('age_min_months', { ascending: true })

  if (!ratioReqs) {
    return { ok: false as const, error: { _form: ['Failed to fetch ratio requirements'] } }
  }

  const results: Array<{
    classroom_id: string
    classroom_name: string
    students_present: number
    staff_present: number
    ratio_actual: number
    ratio_required: number
    compliant: boolean
  }> = []

  for (const classroom of classrooms) {
    // Count checked-in students
    const { count: studentCount } = await supabase
      .from('check_ins')
      .select('id', { count: 'exact', head: true })
      .eq('tenant_id', tenantId)
      .gte('checked_in_at', today + 'T00:00:00Z')
      .is('checked_out_at' as string, null)

    // Count staff assigned today
    const dayOfWeek = new Date().getDay()
    const { count: staffCount } = await supabase
      .from('classroom_staff_assignments')
      .select('id', { count: 'exact', head: true })
      .eq('classroom_id', classroom.id)
      .eq('tenant_id', tenantId)
      .lte('assigned_from', today)
      .or(`assigned_to.is.null,assigned_to.gte.${today}`)

    const students = studentCount ?? 0
    const staff = staffCount ?? 1

    // Find the most restrictive applicable ratio
    const ageMin = classroom.age_range_min_months as number
    const applicableReq = ratioReqs.find(
      (r) =>
        (r.age_min_months as number) <= ageMin &&
        (r.age_max_months as number) >= ageMin,
    )

    const ratioRequired = applicableReq
      ? (applicableReq.max_children_per_caregiver as number)
      : 10 // Default fallback
    const ratioActual = staff > 0 ? students / staff : students
    const compliant = ratioActual <= ratioRequired

    results.push({
      classroom_id: classroom.id as string,
      classroom_name: classroom.name as string,
      students_present: students,
      staff_present: staff,
      ratio_actual: Math.round(ratioActual * 10) / 10,
      ratio_required: ratioRequired,
      compliant,
    })

    // Log the compliance check
    await supabase.from('ratio_compliance_log').insert({
      tenant_id: tenantId,
      classroom_id: classroom.id,
      checked_at: now,
      students_present: students,
      staff_present: staff,
      ratio_actual: ratioActual,
      ratio_required: ratioRequired,
      compliant,
    })
  }

  return { ok: true as const, results }
}
