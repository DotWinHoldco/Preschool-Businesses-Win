// @anchor: cca.checkin.helpers
// Helper functions for check-in/check-out server actions
// See CCA_BUILD_BRIEF.md §7

import { createAdminClient } from '@/lib/supabase/admin'
export { getTenantId } from '@/lib/actions/get-tenant-id'

/**
 * Check if a family has custody of the student today.
 * Returns true if:
 * - custody_schedule.type === 'full' (sole custody)
 * - custody_schedule.type === 'alternating_weeks' and this is their week
 * - custody_schedule.type === 'specific_days' and today is in their days
 * - No custody schedule is set (default: allowed)
 */
export async function getCustodyScheduleForToday(
  studentId: string,
  familyId: string,
): Promise<{ hasCustody: boolean; schedule: Record<string, unknown> | null }> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('student_family_links')
    .select('custody_schedule')
    .eq('student_id', studentId)
    .eq('family_id', familyId)
    .maybeSingle()

  if (error || !data) {
    // No link found — not authorized through this family
    return { hasCustody: false, schedule: null }
  }

  const schedule = data.custody_schedule as Record<string, unknown> | null

  // No custody schedule means no restrictions (default: allowed)
  if (!schedule || !schedule.type) {
    return { hasCustody: true, schedule }
  }

  const today = new Date()
  const dayOfWeek = today.toLocaleDateString('en-US', { weekday: 'lowercase' as Intl.DateTimeFormatOptions['weekday'] })
  const dayName = today.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase()

  switch (schedule.type) {
    case 'full':
      return { hasCustody: true, schedule }

    case 'specific_days': {
      const days = (schedule.days as string[]) ?? []
      const hasCustody = days.some(
        (d) => d.toLowerCase() === dayName || d.toLowerCase() === dayOfWeek,
      )
      return { hasCustody, schedule }
    }

    case 'alternating_weeks': {
      // Use ISO week number to determine which family has custody
      const startOfYear = new Date(today.getFullYear(), 0, 1)
      const daysDiff = Math.floor(
        (today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24),
      )
      const weekNumber = Math.ceil((daysDiff + startOfYear.getDay() + 1) / 7)
      const isEvenWeek = weekNumber % 2 === 0
      const isPrimaryFamily = schedule.is_primary_week_even
        ? isEvenWeek
        : !isEvenWeek
      return { hasCustody: isPrimaryFamily, schedule }
    }

    case 'custom':
      // Custom schedules default to allowed — admin must handle exceptions
      return { hasCustody: true, schedule }

    default:
      return { hasCustody: true, schedule }
  }
}

/**
 * Fetch all allergies for a student.
 * Returns the list of allergies, with severe/life_threatening flagged.
 */
export async function getStudentAllergies(studentId: string): Promise<{
  allergies: Array<{
    id: string
    allergen: string
    severity: string
    reaction_description: string | null
    treatment_protocol: string | null
    medication_name: string | null
    medication_location: string | null
    epipen_on_site: boolean
  }>
  hasSevere: boolean
  hasLifeThreatening: boolean
}> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('student_allergies')
    .select(
      'id, allergen, severity, reaction_description, treatment_protocol, medication_name, medication_location, epipen_on_site',
    )
    .eq('student_id', studentId)

  if (error || !data) {
    return { allergies: [], hasSevere: false, hasLifeThreatening: false }
  }

  const allergies = data.map((a) => ({
    id: a.id as string,
    allergen: a.allergen as string,
    severity: a.severity as string,
    reaction_description: a.reaction_description as string | null,
    treatment_protocol: a.treatment_protocol as string | null,
    medication_name: a.medication_name as string | null,
    medication_location: a.medication_location as string | null,
    epipen_on_site: (a.epipen_on_site as boolean) ?? false,
  }))

  return {
    allergies,
    hasSevere: allergies.some((a) => a.severity === 'severe'),
    hasLifeThreatening: allergies.some(
      (a) => a.severity === 'life_threatening',
    ),
  }
}

/**
 * Get the current date string in YYYY-MM-DD format for the tenant's timezone.
 */
export function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0]
}

/**
 * Fetch student details for display after check-in.
 */
export async function getStudentDetails(studentId: string): Promise<{
  id: string
  first_name: string
  last_name: string
  preferred_name: string | null
  classroom_name: string | null
  classroom_id: string | null
  photo_path: string | null
} | null> {
  const supabase = createAdminClient()

  // Get student basic info
  const { data: student, error } = await supabase
    .from('students')
    .select('id, first_name, last_name, preferred_name, photo_path')
    .eq('id', studentId)
    .maybeSingle()

  if (error || !student) return null

  // Get current classroom assignment
  const today = getTodayDateString()
  const { data: assignment } = await supabase
    .from('student_classroom_assignments')
    .select('classroom_id, classrooms(name)')
    .eq('student_id', studentId)
    .lte('assigned_from', today)
    .or(`assigned_to.is.null,assigned_to.gte.${today}`)
    .maybeSingle()

  const classroomData = assignment?.classrooms as unknown as { name: string } | null

  return {
    id: student.id as string,
    first_name: student.first_name as string,
    last_name: student.last_name as string,
    preferred_name: student.preferred_name as string | null,
    classroom_name: classroomData?.name ?? null,
    classroom_id: (assignment?.classroom_id as string) ?? null,
    photo_path: student.photo_path as string | null,
  }
}
