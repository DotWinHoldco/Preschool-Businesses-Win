// @anchor: cca.food-program.menu-planner
'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/cn'
import { Plus, Check, AlertTriangle, Copy, Save } from 'lucide-react'

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast' },
  { key: 'am_snack', label: 'AM Snack' },
  { key: 'lunch', label: 'Lunch' },
  { key: 'pm_snack', label: 'PM Snack' },
] as const

const FOOD_COMPONENTS = [
  { key: 'grains', label: 'Grains' },
  { key: 'meat_alt', label: 'Meat/Alt' },
  { key: 'vegetable', label: 'Vegetable' },
  { key: 'fruit', label: 'Fruit' },
  { key: 'milk', label: 'Milk' },
] as const

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']

interface MealPlan {
  date: string
  meal_type: string
  items: string[]
  food_components: Record<string, boolean>
}

interface MenuPlannerProps {
  weekStartDate: string
  initialMeals?: MealPlan[]
  onSave?: (meals: MealPlan[]) => void
}

export function MenuPlanner({ weekStartDate, initialMeals = [], onSave }: MenuPlannerProps) {
  const [meals, setMeals] = useState<MealPlan[]>(initialMeals)
  const [editingMeal, setEditingMeal] = useState<{ dayIndex: number; mealType: string } | null>(null)
  const [currentItems, setCurrentItems] = useState<string[]>([])
  const [currentComponents, setCurrentComponents] = useState<Record<string, boolean>>({})
  const [newItem, setNewItem] = useState('')

  const getMeal = (dayIndex: number, mealType: string) => {
    const dateOffset = new Date(weekStartDate)
    dateOffset.setDate(dateOffset.getDate() + dayIndex)
    const dateStr = dateOffset.toISOString().split('T')[0]
    return meals.find((m) => m.date === dateStr && m.meal_type === mealType)
  }

  const openEditor = (dayIndex: number, mealType: string) => {
    const meal = getMeal(dayIndex, mealType)
    setEditingMeal({ dayIndex, mealType })
    setCurrentItems(meal?.items ?? [])
    setCurrentComponents(meal?.food_components ?? {})
    setNewItem('')
  }

  const saveMeal = () => {
    if (!editingMeal) return
    const dateOffset = new Date(weekStartDate)
    dateOffset.setDate(dateOffset.getDate() + editingMeal.dayIndex)
    const dateStr = dateOffset.toISOString().split('T')[0]

    setMeals((prev) => {
      const filtered = prev.filter(
        (m) => !(m.date === dateStr && m.meal_type === editingMeal.mealType)
      )
      return [
        ...filtered,
        {
          date: dateStr,
          meal_type: editingMeal.mealType,
          items: currentItems,
          food_components: currentComponents,
        },
      ]
    })
    setEditingMeal(null)
  }

  const addItem = () => {
    if (newItem.trim()) {
      setCurrentItems((prev) => [...prev, newItem.trim()])
      setNewItem('')
    }
  }

  const checkCACFPCompliance = (mealType: string, components: Record<string, boolean>): boolean => {
    if (mealType === 'breakfast') {
      return !!components.grains && !!components.milk && (!!components.fruit || !!components.vegetable)
    }
    if (mealType === 'lunch' || mealType === 'supper') {
      return !!components.grains && !!components.meat_alt && !!components.vegetable && !!components.fruit && !!components.milk
    }
    // Snacks need at least 2 components
    const count = Object.values(components).filter(Boolean).length
    return count >= 2
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
          Weekly Menu - {weekStartDate}
        </h2>
        <button
          onClick={() => onSave?.(meals)}
          className="flex items-center gap-2 rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm font-medium text-[var(--color-primary-foreground)] hover:opacity-90 transition-opacity"
        >
          <Save className="h-4 w-4" /> Save Menu
        </button>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="w-24 p-2 text-left text-xs font-medium text-[var(--color-muted-foreground)]" />
              {DAYS.map((day) => (
                <th key={day} className="p-2 text-center text-xs font-semibold text-[var(--color-foreground)]">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEAL_TYPES.map((mt) => (
              <tr key={mt.key} className="border-t border-[var(--color-border)]">
                <td className="p-2 text-xs font-medium text-[var(--color-muted-foreground)] align-top">
                  {mt.label}
                </td>
                {DAYS.map((_, dayIndex) => {
                  const meal = getMeal(dayIndex, mt.key)
                  const compliant = meal ? checkCACFPCompliance(mt.key, meal.food_components) : false

                  return (
                    <td key={dayIndex} className="p-1 align-top">
                      <button
                        onClick={() => openEditor(dayIndex, mt.key)}
                        className={cn(
                          'w-full min-h-[60px] rounded-[var(--radius)] border p-2 text-left text-xs transition-colors',
                          meal
                            ? compliant
                              ? 'border-[var(--color-primary)]/30 bg-[var(--color-primary)]/5'
                              : 'border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5'
                            : 'border-dashed border-[var(--color-border)] hover:border-[var(--color-primary)]'
                        )}
                      >
                        {meal ? (
                          <>
                            <div className="flex items-center gap-1 mb-1">
                              {compliant ? (
                                <Check className="h-3 w-3 text-[var(--color-primary)]" />
                              ) : (
                                <AlertTriangle className="h-3 w-3 text-[var(--color-warning)]" />
                              )}
                              <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">
                                {compliant ? 'CACFP' : 'Incomplete'}
                              </span>
                            </div>
                            <div className="text-[var(--color-foreground)] line-clamp-2">
                              {meal.items.join(', ')}
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[var(--color-muted-foreground)]">
                            <Plus className="h-3 w-3 mr-1" /> Add
                          </div>
                        )}
                      </button>
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Meal editor modal */}
      {editingMeal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-[var(--radius)] bg-[var(--color-card)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)] mb-4">
              {DAYS[editingMeal.dayIndex]} - {MEAL_TYPES.find((m) => m.key === editingMeal.mealType)?.label}
            </h3>

            {/* Items */}
            <div className="space-y-2 mb-4">
              <label className="text-sm font-medium text-[var(--color-muted-foreground)]">Menu Items</label>
              {currentItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-[var(--color-foreground)]">{item}</span>
                  <button
                    onClick={() => setCurrentItems((prev) => prev.filter((_, idx) => idx !== i))}
                    className="text-xs text-[var(--color-destructive)]"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addItem()}
                  placeholder="Add item..."
                  className="flex-1 rounded-[var(--radius)] border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-[var(--color-primary)]"
                />
                <button onClick={addItem} className="rounded-[var(--radius)] bg-[var(--color-primary)] px-3 py-1.5 text-sm text-[var(--color-primary-foreground)]">
                  Add
                </button>
              </div>
            </div>

            {/* USDA Components */}
            <div className="mb-4">
              <label className="text-sm font-medium text-[var(--color-muted-foreground)] mb-2 block">
                USDA Food Components
              </label>
              <div className="flex flex-wrap gap-2">
                {FOOD_COMPONENTS.map((fc) => (
                  <button
                    key={fc.key}
                    type="button"
                    onClick={() =>
                      setCurrentComponents((prev) => ({ ...prev, [fc.key]: !prev[fc.key] }))
                    }
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium border transition-colors',
                      currentComponents[fc.key]
                        ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
                        : 'border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]'
                    )}
                  >
                    {fc.label}
                  </button>
                ))}
              </div>
              {!checkCACFPCompliance(editingMeal.mealType, currentComponents) && currentItems.length > 0 && (
                <p className="mt-2 flex items-center gap-1 text-xs text-[var(--color-warning)]">
                  <AlertTriangle className="h-3 w-3" />
                  Missing required CACFP food components
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setEditingMeal(null)}
                className="rounded-[var(--radius)] px-4 py-2 text-sm text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              >
                Cancel
              </button>
              <button
                onClick={saveMeal}
                className="rounded-[var(--radius)] bg-[var(--color-primary)] px-4 py-2 text-sm text-[var(--color-primary-foreground)]"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
