// @anchor: cca.food-program.kitchen-prep
import { UtensilsCrossed, Users, AlertTriangle, ShieldAlert, Clock } from 'lucide-react'

interface ClassroomMealInfo {
  classroom_name: string
  student_count: number
  allergies: Array<{ student_name: string; allergens: string[]; severity: string }>
}

interface MealInfo {
  meal_type: string
  time: string
  items: string[]
  food_components: Record<string, boolean>
}

interface KitchenPrepViewProps {
  date: string
  meals: MealInfo[]
  classrooms: ClassroomMealInfo[]
  totalStudents: number
}

const mealTypeLabels: Record<string, string> = {
  breakfast: 'Breakfast',
  am_snack: 'AM Snack',
  lunch: 'Lunch',
  pm_snack: 'PM Snack',
  supper: 'Supper',
}

export function KitchenPrepView({ date, meals, classrooms, totalStudents }: KitchenPrepViewProps) {
  // Collect all allergies across classrooms
  const allAllergies = classrooms.flatMap((c) => c.allergies)
  const lifeThreateningAllergies = allAllergies.filter(
    (a) => a.severity === 'life_threatening' || a.severity === 'severe',
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <UtensilsCrossed className="h-6 w-6 text-[var(--color-primary)]" />
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Kitchen Prep</h2>
              <p className="text-sm text-[var(--color-muted-foreground)]">{date}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Users className="h-4 w-4 text-[var(--color-muted-foreground)]" />
            <span className="font-semibold text-[var(--color-foreground)]">{totalStudents}</span>
            <span className="text-[var(--color-muted-foreground)]">students expected</span>
          </div>
        </div>
      </div>

      {/* Allergy alert */}
      {lifeThreateningAllergies.length > 0 && (
        <div className="rounded-[var(--radius)] border-2 border-[var(--color-destructive)] bg-[var(--color-destructive)]/5 p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="h-5 w-5 text-[var(--color-destructive)]" />
            <h3 className="text-sm font-bold text-[var(--color-destructive)]">
              Severe / Life-Threatening Allergies Today
            </h3>
          </div>
          <div className="space-y-1">
            {lifeThreateningAllergies.map((a, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-medium text-[var(--color-foreground)]">
                  {a.student_name}:
                </span>
                <span className="text-[var(--color-destructive)] font-semibold">
                  {a.allergens.join(', ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Today's meals */}
      <div className="grid gap-4 md:grid-cols-2">
        {meals.map((meal, i) => (
          <div
            key={i}
            className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
                {mealTypeLabels[meal.meal_type] ?? meal.meal_type}
              </h3>
              <span className="flex items-center gap-1 text-xs text-[var(--color-muted-foreground)]">
                <Clock className="h-3 w-3" /> {meal.time}
              </span>
            </div>
            <ul className="space-y-1 mb-3">
              {meal.items.map((item, j) => (
                <li
                  key={j}
                  className="text-sm text-[var(--color-foreground)] flex items-center gap-2"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary)]" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex gap-1.5 flex-wrap">
              {Object.entries(meal.food_components)
                .filter(([, v]) => v)
                .map(([key]) => (
                  <span
                    key={key}
                    className="rounded-full bg-[var(--color-primary)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-primary)]"
                  >
                    {key.replace('_', '/')}
                  </span>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Headcount by classroom */}
      <div className="rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
            Headcount by Classroom
          </h3>
        </div>
        <div className="divide-y divide-[var(--color-border)]">
          {classrooms.map((cr, i) => (
            <div key={i} className="flex items-center justify-between p-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--color-foreground)]">
                  {cr.classroom_name}
                </span>
                {cr.allergies.length > 0 && (
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-[var(--color-warning)]/10 px-1.5 py-0.5 text-[10px] font-medium text-[var(--color-warning)]">
                    <AlertTriangle className="h-2.5 w-2.5" />
                    {cr.allergies.length} allergy
                  </span>
                )}
              </div>
              <span className="text-sm font-semibold text-[var(--color-foreground)]">
                {cr.student_count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
