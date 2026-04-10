// @anchor: cca.food-program.menus-page
import { createTenantServerClient } from '@/lib/supabase/server'
import { MenuPlanner } from '@/components/portal/food-program/menu-planner'
import { Calendar } from 'lucide-react'

export default async function MenusPage() {
  const supabase = await createTenantServerClient()

  // Get current week start (Monday)
  const now = new Date()
  const dayOfWeek = now.getDay()
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + diff)
  const weekStart = monday.toISOString().split('T')[0]

  // Fetch existing menus for the week
  const weekEnd = new Date(monday)
  weekEnd.setDate(monday.getDate() + 4)
  const weekEndStr = weekEnd.toISOString().split('T')[0]

  const { data: menus } = await supabase
    .from('meal_menus')
    .select('*')
    .gte('date', weekStart)
    .lte('date', weekEndStr)

  const initialMeals = (menus ?? []).map((m: Record<string, unknown>) => ({
    date: m.date as string,
    meal_type: m.meal_type as string,
    items: (m.items as string[]) ?? [],
    food_components: (m.food_components as Record<string, boolean>) ?? {},
  }))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <Calendar className="h-5 w-5 text-[var(--color-primary)]" />
          <h1 className="text-2xl font-bold text-[var(--color-foreground)]">Menu Planner</h1>
        </div>
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Plan weekly menus with USDA CACFP food component validation
        </p>
      </div>

      <MenuPlanner weekStartDate={weekStart} initialMeals={initialMeals} />
    </div>
  )
}
