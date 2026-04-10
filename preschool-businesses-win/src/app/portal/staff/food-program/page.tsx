// @anchor: cca.food-program.staff-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { KitchenPrepView } from '@/components/portal/food-program/kitchen-prep-view'
import { UtensilsCrossed } from 'lucide-react'

export default async function StaffFoodProgramPage() {
  const supabase = await createTenantServerClient()
  const today = new Date().toISOString().split('T')[0]

  // Fetch today's menus
  const { data: menus } = await supabase
    .from('meal_menus')
    .select('*')
    .eq('date', today)

  // Fetch classrooms with student counts
  const { data: classrooms } = await supabase
    .from('classrooms')
    .select('id, name, current_enrollment_count')
    .eq('status', 'active')

  // Fetch all student allergies for today's checked-in students
  const { data: allergies } = await supabase
    .from('student_allergies')
    .select('student_id, allergen, severity, students!inner(first_name, last_name)')

  const mealInfo = (menus ?? []).map((m: Record<string, unknown>) => ({
    meal_type: m.meal_type as string,
    time: m.meal_type === 'breakfast' ? '8:30 AM' : m.meal_type === 'am_snack' ? '10:00 AM' : m.meal_type === 'lunch' ? '11:30 AM' : '2:30 PM',
    items: (m.items as string[]) ?? [],
    food_components: (m.food_components as Record<string, boolean>) ?? {},
  }))

  const classroomInfo = (classrooms ?? []).map((c: Record<string, unknown>) => {
    const classroomAllergies = (allergies ?? [])
      .filter(() => true) // In production: filter by classroom assignment
      .map((a: Record<string, unknown>) => {
        const s = a.students as Record<string, unknown> | null
        return {
          student_name: s ? `${s.first_name} ${s.last_name}` : 'Unknown',
          allergens: [a.allergen as string],
          severity: a.severity as string,
        }
      })

    return {
      classroom_name: c.name as string,
      student_count: (c.current_enrollment_count as number) ?? 0,
      allergies: classroomAllergies,
    }
  })

  const totalStudents = classroomInfo.reduce((s, c) => s + c.student_count, 0)

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <UtensilsCrossed className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Meal Service</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Kitchen prep and meal recording
        </p>
      </div>

      <KitchenPrepView
        date={today}
        meals={mealInfo}
        classrooms={classroomInfo}
        totalStudents={totalStudents}
      />
    </div>
  )
}
