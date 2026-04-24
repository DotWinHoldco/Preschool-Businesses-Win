'use client'

// @anchor: cca.food-program.menus-page-client
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { MenuPlanner } from '@/components/portal/food-program/menu-planner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogOverlay, DialogContent, DialogClose } from '@/components/ui/dialog'
import { toast } from '@/components/ui/toast'
import { saveMealMenus } from '@/lib/actions/food-program/save-meal-menus'
import type { MealType } from '@/lib/schemas/food-program'

interface MealPlan {
  date: string
  meal_type: string
  items: string[]
  food_components: Record<string, boolean>
}

const MEAL_SLOTS = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'am_snack', label: 'AM Snack' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'pm_snack', label: 'PM Snack' },
] as const

const CACFP_COMPONENTS = [
  { key: 'grains', label: 'Grains' },
  { key: 'meat_alt', label: 'Meat/Alternate' },
  { key: 'vegetable', label: 'Vegetable' },
  { key: 'fruit', label: 'Fruit' },
  { key: 'milk', label: 'Milk' },
] as const

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface MenusPageClientProps {
  weekStartDate: string
  initialMeals: MealPlan[]
}

export function MenusPageClient({ weekStartDate, initialMeals }: MenusPageClientProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [extraMeals, setExtraMeals] = useState<MealPlan[]>([])

  // Quick-add form state
  const [dayIndex, setDayIndex] = useState(0)
  const [mealSlot, setMealSlot] = useState('breakfast')
  const [itemName, setItemName] = useState('')
  const [component, setComponent] = useState('grains')

  async function handleSave(meals: MealPlan[]) {
    if (saving) return
    setSaving(true)
    try {
      const payload = meals
        .filter((m) => m.items.length > 0)
        .map((m) => ({
          date: m.date,
          meal_type: m.meal_type as MealType,
          items: m.items,
          food_components: {
            grains: !!m.food_components.grains,
            meat_alt: !!m.food_components.meat_alt,
            vegetable: !!m.food_components.vegetable,
            fruit: !!m.food_components.fruit,
            milk: !!m.food_components.milk,
          },
        }))

      const result = await saveMealMenus({ menus: payload })
      if (!result.ok) {
        toast({
          variant: 'error',
          title: 'Failed to save menus',
          description: result.error ?? 'An unexpected error occurred',
        })
        return
      }
      toast({
        variant: 'success',
        title: `Saved ${result.count ?? 0} menu${(result.count ?? 0) === 1 ? '' : 's'}`,
        description:
          result.warnings && result.warnings.length > 0
            ? `${result.warnings.length} meal(s) missing CACFP components`
            : 'All meals meet the CACFP pattern',
      })
      setExtraMeals([])
    } catch (err) {
      toast({
        variant: 'error',
        title: 'Failed to save menus',
        description: err instanceof Error ? err.message : 'Unknown error',
      })
    } finally {
      setSaving(false)
    }
  }

  function handleQuickAdd(e: React.FormEvent) {
    e.preventDefault()
    if (!itemName.trim()) return

    const dateOffset = new Date(weekStartDate)
    dateOffset.setDate(dateOffset.getDate() + dayIndex)
    const dateStr = dateOffset.toISOString().split('T')[0]

    const newMeal: MealPlan = {
      date: dateStr,
      meal_type: mealSlot,
      items: [itemName.trim()],
      food_components: { [component]: true },
    }

    setExtraMeals((prev) => [...prev, newMeal])
    setItemName('')
    setAddDialogOpen(false)
  }

  const allMeals = [...initialMeals, ...extraMeals]

  return (
    <>
      <div className="flex items-center gap-2 mb-4">
        <Button size="sm" variant="secondary" onClick={() => setAddDialogOpen(true)}>
          <Plus className="h-4 w-4" /> Quick Add Item
        </Button>
        {saving && <span className="text-xs text-[var(--color-muted-foreground)]">Saving...</span>}
      </div>

      <MenuPlanner weekStartDate={weekStartDate} initialMeals={allMeals} onSave={handleSave} />

      {/* Quick Add Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogOverlay onClick={() => setAddDialogOpen(false)} />
        <DialogContent
          title="Quick Add Menu Item"
          description="Add a single item to the weekly menu plan."
        >
          <DialogClose onClick={() => setAddDialogOpen(false)} />
          <form onSubmit={handleQuickAdd} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Day
                </label>
                <select
                  value={dayIndex}
                  onChange={(e) => setDayIndex(Number(e.target.value))}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {DAYS.map((d, i) => (
                    <option key={d} value={i}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                  Meal Slot
                </label>
                <select
                  value={mealSlot}
                  onChange={(e) => setMealSlot(e.target.value)}
                  className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
                >
                  {MEAL_SLOTS.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                Item Name *
              </label>
              <Input
                inputSize="sm"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="e.g. Whole wheat toast"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[var(--color-foreground)] mb-1">
                CACFP Component
              </label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value)}
                className="w-full h-9 min-h-[48px] rounded-[var(--radius,0.75rem)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 text-sm text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)] focus:ring-offset-1"
              >
                {CACFP_COMPONENTS.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setAddDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" size="sm">
                <Plus className="h-4 w-4" /> Add Item
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
